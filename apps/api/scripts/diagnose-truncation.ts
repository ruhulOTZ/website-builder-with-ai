// One-off diagnostic. Reproduces the parse-v1 invalid-JSON failure on the
// longest fixture (gym-powerlifting-detailed) by calling the AI provider
// directly at the original maxOutputTokens=2048 and writing the raw model
// output to disk so we can inspect HOW it failed (truncation? markdown fence?
// preamble?). Run once via `pnpm --filter @repo/api diagnose:truncation`.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { AIValidationError, type AIProvider } from '@repo/ai';
import { BusinessProfileSchema } from '@repo/shared-types';

import { AI_PROVIDER } from '../src/ai/ai.tokens';
import { AppModule } from '../src/app.module';
import { buildParsePrompt } from '../src/business-profile/prompts/parse-v1';

const FIXTURE = 'gym-powerlifting-detailed.txt';
const MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 2048; // ← original parse-v1 setting that failed.
const TEMPERATURE = 0.2;

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    logger: ['error', 'warn'],
  });
  try {
    const ai = app.get<AIProvider>(AI_PROVIDER);

    const fixturePath = resolve(__dirname, '../test/fixtures/requirements', FIXTURE);
    const rawText = await readFile(fixturePath, 'utf8');
    const { system, user } = buildParsePrompt(rawText);

    // eslint-disable-next-line no-console
    console.log(
      `Diagnostic call → fixture=${FIXTURE}, model=${MODEL}, maxOutputTokens=${String(MAX_OUTPUT_TOKENS)}`,
    );

    const outDir = resolve(__dirname, '../test/eval-output/_diagnostic');
    await mkdir(outDir, { recursive: true });
    const outPath = join(outDir, 'gym-2048-raw.txt');

    try {
      const result = await ai.generateStructured(BusinessProfileSchema, user, {
        model: MODEL,
        system,
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        retries: 0, // We want to see the first failure, not the retry behavior.
      });
      await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`Call SUCCEEDED. Output written to ${outPath}`);
      // eslint-disable-next-line no-console
      console.log(
        `(No truncation observed at maxOutputTokens=${String(MAX_OUTPUT_TOKENS)} on this run — non-determinism may be a factor.)`,
      );
    } catch (err) {
      if (err instanceof AIValidationError) {
        await writeFile(outPath, err.rawOutput, 'utf8');
        // eslint-disable-next-line no-console
        console.log(`Call FAILED with AIValidationError: ${err.message}`);
        // eslint-disable-next-line no-console
        console.log(`Raw model output captured to ${outPath}`);
        // eslint-disable-next-line no-console
        console.log(
          `Length: ${String(err.rawOutput.length)} chars. Last 200 chars below.\n${'─'.repeat(60)}\n${err.rawOutput.slice(-200)}\n${'─'.repeat(60)}`,
        );
      } else {
        console.error('Call FAILED with non-validation error:', err);
        throw err;
      }
    }
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  console.error('diagnose-truncation: unhandled', err);
  process.exit(2);
});

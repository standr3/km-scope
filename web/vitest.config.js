import { defineConfig } from 'vitest/config';
import { writeFileSync } from 'fs';

class FileReporter {
  onFinished(files) {
    console.log('FileReporter onFinished called', files.length);
    const lines = [];
    for (const file of files) {
      for (const suite of file.result?.testResults ?? []) {
        for (const test of suite.children ?? []) {
          const status = test.result?.state === 'pass' ? '✅' : '❌';
          lines.push(`${status} ${suite.name} > ${test.name}`);
          if (test.result?.state === 'fail') {
            lines.push(`   ${test.result?.errors?.[0]?.message ?? ''}`);
          }
        }
      }
    }
    writeFileSync('./test-results.log', lines.join('\n') + '\n');
  }
}

export default defineConfig({
  test: {
    reporters: ['verbose', new FileReporter()],
  },
});
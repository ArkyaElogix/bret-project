import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { ReportPrintDocument } from '../reportPrintDocument';

async function main() {
    // 1. Read JSON payload from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const inputData = Buffer.concat(chunks).toString('utf-8');

    if (!inputData) {
        console.error("No data provided to stdin");
        process.exit(1);
    }

    const reportData = JSON.parse(inputData);

    // 2. Render the React component to a PDF stream
    const stream = await renderToStream(<ReportPrintDocument report={reportData} />);

    // 3. Pipe the PDF stream directly to stdout
    stream.pipe(process.stdout);
}

main().catch((err) => {
    console.error("PDF generation failed:", err);
    process.exit(1);
});

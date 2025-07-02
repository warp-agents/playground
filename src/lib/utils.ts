import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Editor } from '@tiptap/react';

export const ngrokUrl = process.env.NGROK_URL || "https://7315-34-30-240-207.ngrok-free.app"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function formatUrl(url: string) {
  return url.startsWith('https://www.') ? url : `https://www.${url}`;
};

export async function printPDF(fileName: string, editor?: Editor) {
  if (typeof window === 'undefined' || !editor) return;

  try {
    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.createElement('div');
    element.innerHTML = editor.getHTML();
    element.className = 'tiptap pdf-content';

    const offset = 19

    const signatureNodes: { pos: number, node: any }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'insertESign') {
        signatureNodes.push({ pos, node });
      }
      return true;
    });

    const signatureCanvases = document.querySelectorAll('.sigCanvas');

    const signatureSpans = element.querySelectorAll('span[data-type="insert-e-sign"]');

    for (let i = 0; i < Math.min(signatureNodes.length, signatureCanvases.length, signatureSpans.length); i++) {
      const node = signatureNodes[i].node;
      const span = signatureSpans[i];
      const page = span.closest('.page');
      if (!page) continue; 

      const canvas = signatureCanvases[i] as HTMLCanvasElement;
      if (!canvas) continue;

      const signatureDataUrl = canvas.toDataURL('image/png');
      if (signatureDataUrl === 'data:,') continue; 
      const signatureImg = document.createElement('img');
      signatureImg.src = signatureDataUrl;
      signatureImg.style.width = `${node.attrs.width}px`;
      signatureImg.style.position = 'absolute';
      signatureImg.style.left = `${node.attrs.x}px`;
      signatureImg.style.top = `${node.attrs.y-offset}px`;
      signatureImg.style.zIndex = '5';

      page.appendChild(signatureImg);
    }

    const textNodes: { pos: number, node: any }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'insertText') {
        textNodes.push({ pos, node });
      }
      return true;
    });

    const textSpans = element.querySelectorAll('span[data-type="insert-text"]');
    for (let i = 0; i < Math.min(textNodes.length, textSpans.length); i++) {
      const node = textNodes[i].node;
      const span = textSpans[i];
      const page = span.closest('.page');
      if (!page) continue;

      let textNode = editor.view.domAtPos(textNodes[i].pos).node;
      const autoTextSizeDiv = (textNode as any).querySelector('.auto-text-size');
      const fontSize = autoTextSizeDiv ? 
        window.getComputedStyle(autoTextSizeDiv).fontSize || 
        autoTextSizeDiv.style.fontSize : 
        null;

      const textDiv = document.createElement('div');
      textDiv.textContent = node.textContent || '';
      textDiv.className = 'insert-text-container';
      textDiv.style.position = 'absolute';
      textDiv.style.left = `${node.attrs.x}px`;
      textDiv.style.top = `${node.attrs.y}px`;
      textDiv.style.width = `${node.attrs.width}px`;
      textDiv.style.fontSize = fontSize || '16px';
      textDiv.style.color = '#000'; 
      textDiv.style.zIndex = '5';
      textDiv.style.whiteSpace = 'nowrap';
      textDiv.style.lineHeight = 'normal';

      page.appendChild(textDiv);
      span.remove();
    }

    const style = document.createElement('style');
    style.textContent = `
      .pdf-content {
        color: #000;
        padding: 0px;

        :first-child {
          margin-top: 0px !important;
        }
      }
      .pdf-content .page {
        position: relative;
      }
      .pdf-content h1 {
        font-size: 1.75rem;
        font-weight: bold;
        margin-top: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        line-height: 1.1;
        text-wrap: pretty;
      }
      .pdf-content h2 {
        font-size: 1.5rem;
        font-weight: bold;
        margin-top: 1.5rem !important;
        margin-bottom: 1.5rem !important;
        line-height: 1.1;
        text-wrap: pretty;
      }
      .pdf-content h3 {
        font-size: 1.25rem;
        font-weight: bold;
        margin-top: 1rem !important;
        margin-bottom: .5rem !important;
        line-height: 1.1;
        text-wrap: pretty;
      }
      .pdf-content h4 {
        font-size: 1.125rem;
        font-weight: bold;
        margin-top: 1rem !important;
        margin-bottom: .5rem !important;
        line-height: 1.1;
        text-wrap: pretty;
      }
      .pdf-content h5,
      .pdf-content h6 {
        font-size: 1rem;
        font-weight: bold;
        margin-top: 1rem !important;
        margin-bottom: .5rem !important;
        line-height: 1.1;
        text-wrap: pretty;
      } 
      .pdf-content table {
        width: 100% !important;
        border-collapse: collapse;
        overflow: hidden;
        table-layout: fixed;
        font-size: 16px;
      }
      .pdf-content table th {
        background-color: #f3f4f6;
        font-size: 16px;
        box-sizing: border-box;
        min-width: 1em;
        padding: 6px 8px;
        position: relative;
        border: 1px solid #e5e7eb;
        height: 1.75rem;
        vertical-align: top !important;
        text-align: left;
      }
      .pdf-content table td {
        border: 1px solid #e5e7eb;
        font-size: 16px;
        box-sizing: border-box;
        min-width: 1em;
        padding: 6px 8px;
        height: 1.75rem;
        position: relative;
        vertical-align: top !important;
      }
      .pdf-content p {
        font-size: 1rem !important;
      }
      .pdf-content .no-print { 
        display: none;
      }
    `;
    document.head.appendChild(style);

    var opt = {
      margin: 1,
      autoPaging: 'text',
      filename: `${fileName}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 2, 
        letterRendering: true 
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'] 
      }
    };

    await html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        document.head.removeChild(style);
      });

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
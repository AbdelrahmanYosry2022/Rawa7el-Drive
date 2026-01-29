import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  convertInchesToTwip,
} from 'docx';

export interface ExportQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface GenerateExamDocOptions {
  examTitle: string;
  questions: ExportQuestion[];
  withAnswers?: boolean;
}

// Arabic-friendly font
const ARABIC_FONT = 'Traditional Arabic';
const FALLBACK_FONT = 'Arial';

/**
 * Generates a Word document (.docx) for an exam
 * @param options - Exam title, questions, and whether to include answers
 * @returns Blob of the generated document
 */
export async function generateExamDoc(
  options: GenerateExamDocOptions
): Promise<Blob> {
  const { examTitle, questions, withAnswers = false } = options;

  const children: Paragraph[] = [];

  // Header: Exam Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: examTitle,
          bold: true,
          size: 48, // 24pt
          font: ARABIC_FONT,
          rightToLeft: true,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 400 },
    })
  );

  // Subtitle based on mode
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: withAnswers ? '( نسخة المعلم - مع الاجابات )' : '( نسخة الطالب )',
          size: 24, // 12pt
          font: ARABIC_FONT,
          rightToLeft: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 600 },
    })
  );

  // Separator line
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '_'.repeat(70),
          size: 20,
          font: FALLBACK_FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Questions
  questions.forEach((question, index) => {
    const questionNumber = index + 1;
    // Arabic-Indic numerals
    const arabicNumber = questionNumber.toLocaleString('ar-EG');

    // Question text with number
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${arabicNumber} - `,
            bold: true,
            size: 28, // 14pt
            font: ARABIC_FONT,
            rightToLeft: true,
          }),
          new TextRun({
            text: question.text,
            size: 28,
            font: ARABIC_FONT,
            rightToLeft: true,
          }),
          new TextRun({
            text: `  ( ${question.points} ${question.points === 1 ? 'نقطة' : 'نقاط'} )`,
            size: 22,
            font: ARABIC_FONT,
            rightToLeft: true,
          }),
        ],
        bidirectional: true,
        spacing: { before: 300, after: 150 },
      })
    );

    // Options
    if (question.type === 'TRUE_FALSE') {
      const trueOption = 'صحيح';
      const falseOption = 'خطأ';

      // True option
      const isTrueCorrect = question.correctAnswer === trueOption;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '      (   )  ',
              size: 24,
              font: FALLBACK_FONT,
            }),
            new TextRun({
              text: trueOption,
              size: 24,
              font: ARABIC_FONT,
              bold: withAnswers && isTrueCorrect,
              rightToLeft: true,
            }),
            ...(withAnswers && isTrueCorrect
              ? [
                  new TextRun({
                    text: '  << الاجابة الصحيحة',
                    size: 20,
                    bold: true,
                    color: '008000',
                    font: ARABIC_FONT,
                    rightToLeft: true,
                  }),
                ]
              : []),
          ],
          bidirectional: true,
          spacing: { after: 80 },
        })
      );

      // False option
      const isFalseCorrect = question.correctAnswer === falseOption;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '      (   )  ',
              size: 24,
              font: FALLBACK_FONT,
            }),
            new TextRun({
              text: falseOption,
              size: 24,
              font: ARABIC_FONT,
              bold: withAnswers && isFalseCorrect,
              rightToLeft: true,
            }),
            ...(withAnswers && isFalseCorrect
              ? [
                  new TextRun({
                    text: '  << الاجابة الصحيحة',
                    size: 20,
                    bold: true,
                    color: '008000',
                    font: ARABIC_FONT,
                    rightToLeft: true,
                  }),
                ]
              : []),
          ],
          bidirectional: true,
          spacing: { after: 200 },
        })
      );
    } else {
      // MCQ options with Arabic letters
      const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
      
      question.options.forEach((option, optIndex) => {
        const isCorrect = option === question.correctAnswer;
        const optionLetter = arabicLetters[optIndex] || String(optIndex + 1);

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `      ${optionLetter} )  `,
                size: 24,
                font: ARABIC_FONT,
                rightToLeft: true,
              }),
              new TextRun({
                text: option,
                size: 24,
                font: ARABIC_FONT,
                bold: withAnswers && isCorrect,
                rightToLeft: true,
              }),
              ...(withAnswers && isCorrect
                ? [
                    new TextRun({
                      text: '  << الاجابة الصحيحة',
                      size: 20,
                      bold: true,
                      color: '008000',
                      font: ARABIC_FONT,
                      rightToLeft: true,
                    }),
                  ]
                : []),
            ],
            bidirectional: true,
            spacing: { after: 80 },
          })
        );
      });
    }

    // Add spacing after each question
    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 200 },
      })
    );
  });

  // Footer with total points
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '_'.repeat(70),
          size: 20,
          font: FALLBACK_FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `اجمالي الدرجات: ${totalPoints} نقطة`,
          bold: true,
          size: 26,
          font: ARABIC_FONT,
          rightToLeft: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { before: 200 },
    })
  );

  // Create document with RTL settings
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Downloads the exam document
 */
export async function downloadExamDoc(
  options: GenerateExamDocOptions,
  filename?: string
): Promise<void> {
  const { saveAs } = await import('file-saver');
  const blob = await generateExamDoc(options);
  
  const defaultFilename = options.withAnswers
    ? `${options.examTitle} - نسخة المعلم.docx`
    : `${options.examTitle} - نسخة الطالب.docx`;
  
  saveAs(blob, filename || defaultFilename);
}

export type ContentStatus = 'live' | 'coming-soon';

export interface SyllabusSection {
  id: string;
  title: string;
  status: ContentStatus;
  route?: string;
}

export interface SyllabusTopic {
  number: number;
  title: string;
  paper: 1 | 2;
  sections: SyllabusSection[];
}

export const sectionRoute =
  '/topics/1-data-representation/1-2-text-sound-images';

export const simulatorRoute = `${sectionRoute}/pixel-bead-simulator`;
export const textStudioRoute = `${sectionRoute}/binary-post-office`;
export const soundStudioRoute = `${sectionRoute}/sound-sampling-studio`;
export const utf16KeyboardRoute = `${sectionRoute}/utf16-keyboard`;

export const soundJourneyRoute = `${sectionRoute}/how-sound-becomes-binary`;
export const imageJourneyRoute = `${sectionRoute}/how-image-becomes-binary`;
export const numberSectionRoute =
  '/topics/1-data-representation/1-1-number-systems';
export const hexApplicationsRoute = `${numberSectionRoute}/hexadecimal-in-action`;
export const hexAdvantagesRoute = `${numberSectionRoute}/why-hexadecimal`;

export interface StudioDemo {
  id: 'text' | 'sound' | 'image' | 'utf16' | 'sound-journey' | 'image-journey';
  title: string;
  category: string;
  status: ContentStatus;
  route: string;
  description: string;
  concepts: string[];
}
export const studioDemos: StudioDemo[] = [
  {
    id: 'image-journey',
    title: 'How an image becomes binary',
    category: 'Image representation',
    status: 'live',
    route: imageJourneyRoute,
    description:
      'Count the pixels, look up each colour code, then scan row by row to build a binary sequence. One image, four clear stages.',
    concepts: ['Pixels', 'Colour codes', 'Storage order'],
  },
  {
    id: 'sound-journey',
    title: 'How sound becomes binary',
    category: 'Sound representation',
    status: 'live',
    route: soundJourneyRoute,
    description:
      'Follow one signal through capture, sampling, quantisation and encoding. Step through the process and trace each sample into binary.',
    concepts: ['8 Hz', '4 bits per sample', 'Analogue to digital'],
  },
  {
    id: 'utf16',
    title: 'UTF-16 Keyboard',
    category: 'Text representation',
    status: 'live',
    route: utf16KeyboardRoute,
    description:
      'Type Chinese characters using hexadecimal codes. Explore a character table, build a message and try whole phrases.',
    concepts: ['Unicode', 'Hexadecimal', 'UTF-16'],
  },
  {
    id: 'text',
    title: 'Binary Post Office',
    category: 'Text representation',
    status: 'live',
    route: textStudioRoute,
    description:
      'Stamp a message into binary. Follow each character through its code, then flip a bit and see what arrives.',
    concepts: ['Character sets', 'ASCII', 'Unicode'],
  },
  {
    id: 'sound',
    title: 'Sound Sampling Studio',
    category: 'Sound representation',
    status: 'live',
    route: soundStudioRoute,
    description:
      'Turn a wave into sample codes. Hear what changes with rate and resolution, then try a blind A/B comparison.',
    concepts: ['Sample rate', 'Sample resolution', 'Binary'],
  },
  {
    id: 'image',
    title: 'Pixel Bead Simulator',
    category: 'Image representation',
    status: 'live',
    route: simulatorRoute,
    description:
      'Rebuild a familiar portrait bead by bead. Explore how resolution and colour depth change the image and its raw size.',
    concepts: ['Pixels', 'Resolution', 'Colour depth'],
  },
];

export const numberDemos: (Omit<StudioDemo, 'id'> & {
  id: 'hex-applications' | 'hex-advantages';
})[] = [
  {
    id: 'hex-applications',
    title: 'Hexadecimal in action',
    category: 'Number systems',
    status: 'live',
    route: hexApplicationsRoute,
    description: 'Trigger errors. Mix colours. Explore addresses.',
    concepts: ['Error codes', 'HTML colours', 'MAC & IPv6'],
  },
  {
    id: 'hex-advantages',
    title: 'Why hexadecimal?',
    category: 'Number systems',
    status: 'live',
    route: hexAdvantagesRoute,
    description: 'Shrink codes. Spot mistakes. Fit more. Convert faster.',
    concepts: ['Compact notation', 'Easier debugging', 'Four-bit groups'],
  },
];
export const allDemos = [...numberDemos, ...studioDemos];

export const syllabus: SyllabusTopic[] = [
  {
    number: 1,
    title: 'Data representation',
    paper: 1,
    sections: [
      {
        id: '1.1',
        title: 'Number systems',
        status: 'live',
        route: numberSectionRoute,
      },
      {
        id: '1.2',
        title: 'Text, sound and images',
        status: 'live',
        route: sectionRoute,
      },
      {
        id: '1.3',
        title: 'Data storage and compression',
        status: 'coming-soon',
      },
    ],
  },
  {
    number: 2,
    title: 'Data transmission',
    paper: 1,
    sections: [
      {
        id: '2.1',
        title: 'Types and methods of data transmission',
        status: 'coming-soon',
      },
      { id: '2.2', title: 'Methods of error detection', status: 'coming-soon' },
      { id: '2.3', title: 'Encryption', status: 'coming-soon' },
    ],
  },
  {
    number: 3,
    title: 'Hardware',
    paper: 1,
    sections: [
      { id: '3.1', title: 'Computer architecture', status: 'coming-soon' },
      { id: '3.2', title: 'Input and output devices', status: 'coming-soon' },
      { id: '3.3', title: 'Data storage', status: 'coming-soon' },
      { id: '3.4', title: 'Network hardware', status: 'coming-soon' },
    ],
  },
  {
    number: 4,
    title: 'Software',
    paper: 1,
    sections: [
      {
        id: '4.1',
        title: 'Types of software and interrupts',
        status: 'coming-soon',
      },
      {
        id: '4.2',
        title: 'Types of programming language, translators and IDEs',
        status: 'coming-soon',
      },
    ],
  },
  {
    number: 5,
    title: 'The internet and its uses',
    paper: 1,
    sections: [
      {
        id: '5.1',
        title: 'The internet and the world wide web',
        status: 'coming-soon',
      },
      { id: '5.2', title: 'Digital currency', status: 'coming-soon' },
      { id: '5.3', title: 'Cyber security', status: 'coming-soon' },
    ],
  },
  {
    number: 6,
    title: 'Automated and emerging technologies',
    paper: 1,
    sections: [
      { id: '6.1', title: 'Automated systems', status: 'coming-soon' },
      { id: '6.2', title: 'Robotics', status: 'coming-soon' },
      { id: '6.3', title: 'Artificial intelligence', status: 'coming-soon' },
    ],
  },
  {
    number: 7,
    title: 'Algorithm design and problem-solving',
    paper: 2,
    sections: [],
  },
  {
    number: 8,
    title: 'Programming',
    paper: 2,
    sections: [
      { id: '8.1', title: 'Programming concepts', status: 'coming-soon' },
      { id: '8.2', title: 'Arrays', status: 'coming-soon' },
      { id: '8.3', title: 'File handling', status: 'coming-soon' },
    ],
  },
  {
    number: 9,
    title: 'Databases',
    paper: 2,
    sections: [],
  },
  {
    number: 10,
    title: 'Boolean logic',
    paper: 2,
    sections: [],
  },
];

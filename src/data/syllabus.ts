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

export const syllabus: SyllabusTopic[] = [
  {
    number: 1,
    title: 'Data representation',
    paper: 1,
    sections: [
      { id: '1.1', title: 'Number systems', status: 'coming-soon' },
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

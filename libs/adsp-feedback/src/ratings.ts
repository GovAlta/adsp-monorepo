import veryDifficultSvgDefault from './assets/Very_Difficult-Default.svg';
import veryDifficultSvgError from './assets/Very_Difficult-Error.svg';
import veryDifficultSvgHover from './assets/Very_Difficult-Hover.svg';
import veryDifficultSvgClick from './assets/Very_Difficult-Click.svg';

import difficultSvgDefault from './assets/Difficult-Default.svg';
import difficultSvgError from './assets/Difficult-Error.svg';
import difficultSvgHover from './assets/Difficult-Hover.svg';
import difficultSvgClick from './assets/Difficult-Click.svg';

import neutralSvgDefault from './assets/Neutral-Default.svg';
import neutralSvgError from './assets/Neutral-Error.svg';
import neutralSvgHover from './assets/Neutral-Hover.svg';
import neutralSvgClick from './assets/Neutral-Click.svg';

import easySvgDefault from './assets/Easy-Default.svg';
import easySvgError from './assets/Easy-Error.svg';
import easySvgHover from './assets/Easy-Hover.svg';
import easySvgClick from './assets/Easy-Click.svg';

import veryEasySvgDefault from './assets/Very_Easy-Default.svg';
import veryEasySvgError from './assets/Very_Easy-Error.svg';
import veryEasySvgHover from './assets/Very_Easy-Hover.svg';
import veryEasySvgClick from './assets/Very_Easy-Click.svg';

export const ratings = [
  {
    label: 'Very Difficult',
    rate: 'terrible',
    value: 0,
    svgDefault: veryDifficultSvgDefault,
    svgError: veryDifficultSvgError,
    svgHover: veryDifficultSvgHover,
    svgClick: veryDifficultSvgClick,
  },
  {
    label: 'Difficult',
    rate: 'bad',
    value: 1,
    svgDefault: difficultSvgDefault,
    svgError: difficultSvgError,
    svgHover: difficultSvgHover,
    svgClick: difficultSvgClick,
  },
  {
    label: 'Neutral',
    rate: 'neutral',
    value: 2,
    svgDefault: neutralSvgDefault,
    svgError: neutralSvgError,
    svgHover: neutralSvgHover,
    svgClick: neutralSvgClick,
  },
  {
    label: 'Easy',
    rate: 'good',
    value: 3,
    svgDefault: easySvgDefault,
    svgError: easySvgError,
    svgHover: easySvgHover,
    svgClick: easySvgClick,
  },
  {
    label: 'Very Easy',
    rate: 'delightful',
    value: 4,
    svgDefault: veryEasySvgDefault,
    svgError: veryEasySvgError,
    svgHover: veryEasySvgHover,
    svgClick: veryEasySvgClick,
  },
];

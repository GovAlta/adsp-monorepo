import difficultSvgDefault from '@assets/Difficult-Default.svg';
import veryDifficultSvgDefault from '@assets/Very_Difficult-Default.svg';
import neutralSvgDefault from '@assets/Neutral-Default.svg';
import easySvgDefault from '@assets/Easy-Default.svg';
import veryEasySvgDefault from '@assets/Very_Easy-Default.svg';
export const ratings = [
  {
    label: 'Very Difficult',
    rate: 'terrible',
    value: 1,
    svgDefault: veryDifficultSvgDefault,
  },
  {
    label: 'Difficult',
    rate: 'bad',
    value: 2,
    svgDefault: difficultSvgDefault,
  },
  {
    label: 'Neutral',
    rate: 'neutral',
    value: 3,
    svgDefault: neutralSvgDefault,
  },
  {
    label: 'Easy',
    rate: 'good',
    value: 4,
    svgDefault: easySvgDefault,
  },
  {
    label: 'Very Easy',
    rate: 'delightful',
    value: 5,
    svgDefault: veryEasySvgDefault,
  },
];

export const transformedData = (data) => {
  return data?.map((item) => {
    const matchedRating = ratings.find((r) => r.rate === item.value.rating);

    return {
      ...item,
      value: {
        ...item.value,
        rating: matchedRating ? matchedRating.label : item.value.rating,
      },
    };
  });
};
export function getRatingLabelByValue(value: number): string | undefined {
  const rating = ratings.find((r) => r.value === value);
  return rating ? rating.label : undefined;
}

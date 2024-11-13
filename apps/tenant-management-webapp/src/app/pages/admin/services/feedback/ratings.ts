const ratings = [
  {
    label: 'Very Difficult',
    rate: 'terrible',
  },
  {
    label: 'Difficult',
    rate: 'bad',
  },
  {
    label: 'Neutral',
    rate: 'neutral',
  },
  {
    label: 'Easy',
    rate: 'good',
  },
  {
    label: 'Very Easy',
    rate: 'delightful',
  },
];

export const transformedData = (data) => {
  data?.map((item) => {
    const matchedRating = ratings.find((r) => r.rate === item.value.rating);
    item.value.rating = matchedRating ? matchedRating?.label : item.value.rating;
    return item;
  });
  return data;
};

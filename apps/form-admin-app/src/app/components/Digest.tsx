import { FunctionComponent } from 'react';
import styled from 'styled-components';

const DigestElement = styled.span<{ rgb: number[] }>`
  display: inline-block;
  background: ${(props) => `rgb(${props.rgb.join(' ')})`};
  height: 1rem;
  width: 0.7rem;
  margin-left: 1px;

  &:first-child {
    border-radius: 0.2rem 0 0 0.2rem;
  }
  &:last-child {
    border-radius: 0 0.2rem 0.2rem 0;
  }
`;

interface DigestProps {
  value: string;
}

export const Digest: FunctionComponent<DigestProps> = ({ value }) => {
  const values = value?.match(/.{6}/g).map(([r1, r2, g1, g2, b1, b2]) => {
    const r = parseInt(r1 + r2, 16),
      g = parseInt(g1 + g2, 16),
      b = parseInt(b1 + b2, 16);

    return [r, g, b];
  });

  return (
    <div>
      {values.map((value, idx) => (
        <DigestElement key={idx} rgb={value} />
      ))}
    </div>
  );
};

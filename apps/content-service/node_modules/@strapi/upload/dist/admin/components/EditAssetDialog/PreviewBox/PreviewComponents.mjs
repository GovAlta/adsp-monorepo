import { Box, Flex, Badge } from '@strapi/design-system';
import { styled } from 'styled-components';

// TODO: find a better naming convention for the file that was an index file before
const RelativeBox = styled(Box)`
  position: relative;
`;
const Wrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  background: repeating-conic-gradient(
      ${({ theme })=>theme.colors.neutral100} 0% 25%,
      transparent 0% 50%
    )
    50% / 20px 20px;

  svg {
    height: 26px;
  }

  img,
  mux-player {
    margin: 0;
    padding: 0;
    max-height: 26.4rem;
    max-width: 100%;
  }

  mux-player {
    --play-button: inline-flex;
    --mute-button: inline-flex;
    --pip-button: inline-flex;
    --fullscreen-button: inline-flex;
    --playback-rate-button: inline-flex;
    --volume-range: inline-flex;
    --time-range: inline-flex;
    --time-display: inline-flex;
    --duration-display: inline-flex;
  }
`;
const ActionRow = styled(Flex)`
  height: 5.2rem;
  background-color: ${({ $blurry })=>$blurry ? `rgba(33, 33, 52, 0.4)` : undefined};
`;
const CroppingActionRow = styled(Flex)`
  z-index: 1;
  height: 5.2rem;
  position: absolute;
  background-color: rgba(33, 33, 52, 0.4);
  width: 100%;
`;
// TODO: fix in parts, this shouldn't happen
const BadgeOverride = styled(Badge)`
  span {
    color: inherit;
    font-weight: ${({ theme })=>theme.fontWeights.regular};
  }
`;
const UploadProgressWrapper = styled.div`
  position: absolute;
  z-index: 2;
  height: 100%;
  width: 100%;
`;

export { ActionRow, BadgeOverride, CroppingActionRow, RelativeBox, UploadProgressWrapper, Wrapper };
//# sourceMappingURL=PreviewComponents.mjs.map

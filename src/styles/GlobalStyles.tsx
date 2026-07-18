import { css, Global } from '@emotion/react';

import { colors } from './theme.ts';

const GlobalStyles = () => {
  return (
    <Global
      styles={css`
        body {
          color: ${colors.text1};
        }
        input {
          box-shadow: none !important;
        }
        textarea {
          resize: none !important;
        }
        h1,
        .h1 {
          font-size: 36px;
          line-height: 43.57px;
        }
        h2,
        .h2 {
          font-size: 25px;
          line-height: 28px;
        }
        h3,
        .h3 {
          font-size: 24px;
          line-height: 29.05px;
        }
        h4,
        .h4 {
          font-size: 16px;
          line-height: 24px;
        }
        h5,
        .h5 {
          font-size: 12.8px;
          line-height: 20px;
        }
        p {
          font-size: 16px;
          line-height: 19.36px;

          &.small {
            font-size: 14px;
            line-height: 16.94px;
          }
          &.big {
            font-size: 18px;
            line-height: 26px;
          }
          &.tiny {
            font-size: 12px;
            line-height: 14.52px;
          }
        }
        a {
          &:hover {
            color: ${colors.primary};
            text-decoration: underline;
          }
        }

        .ant-btn {
          outline: none !important;
          box-shadow: none !important;
          &.ant-btn-primary:not(:disabled):not(.ant-btn-disabled) {
            background-color: ${colors.primary} !important;
            border-color: ${colors.primary} !important;
            span {
              color: white !important;
            }
          }
        }

        .scroll-bar-small {
          &::-webkit-scrollbar {
            height: 8px !important;
          }

          &::-webkit-scrollbar-track {
            background: transparent !important;
          }

          &::-webkit-scrollbar-thumb {
            background: #888 !important;
          }
        }
        .scroll-thin {
          scrollbar-width: thin;
          &::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
        }
      `}
    />
  );
};

export default GlobalStyles;

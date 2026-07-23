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

        .initial-loader {
          position: relative;
          flex-shrink: 0;
          width: 150px;
          height: 150px;
          max-width: none;
          max-height: none;
          animation:
            initial-loader-in 450ms ease-out both,
            initial-loader-breathe 1.8s ease-in-out 450ms infinite alternate;
        }
        .initial-loader-logo-wrapper {
          width: 150px;
          height: 150px;
          max-width: none;
          max-height: none;
          border-radius: 50%;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .initial-loader-logo {
          height: 110px;
          width: auto;
          max-width: none;
        }
        @keyframes initial-loader-in {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes initial-loader-breathe {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0.92;
            transform: scale(1.04);
          }
        }
      `}
    />
  );
};

export default GlobalStyles;

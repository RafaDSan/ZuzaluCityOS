import React from 'react';
import { IconProps } from 'types';

export const ArrowUpTrayIcon: React.FC<IconProps> = ({ size = 6 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={`${size * 4}px`}
      height={`${size * 4}px`}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M9.0625 12.8125C9.0625 13.3303 9.48223 13.75 10 13.75C10.5178 13.75 10.9375 13.3303 10.9375 12.8125L10.9375 5.70082L13.7121 8.47541C14.0782 8.84153 14.6718 8.84153 15.0379 8.47541C15.404 8.1093 15.404 7.5157 15.0379 7.14959L10.6629 2.77459C10.2968 2.40847 9.7032 2.40847 9.33709 2.77459L4.96209 7.14959C4.59597 7.51571 4.59597 8.1093 4.96209 8.47541C5.3282 8.84153 5.9218 8.84153 6.28791 8.47541L9.0625 5.70082L9.0625 12.8125Z"
        fill="currentColor"
      />
      <path
        d="M4.375 12.1875C4.375 11.6697 3.95527 11.25 3.4375 11.25C2.91973 11.25 2.5 11.6697 2.5 12.1875V14.0625C2.5 15.961 4.03902 17.5 5.9375 17.5H14.0625C15.961 17.5 17.5 15.961 17.5 14.0625V12.1875C17.5 11.6697 17.0803 11.25 16.5625 11.25C16.0447 11.25 15.625 11.6697 15.625 12.1875V14.0625C15.625 14.9254 14.9254 15.625 14.0625 15.625L5.9375 15.625C5.07456 15.625 4.375 14.9254 4.375 14.0625L4.375 12.1875Z"
        fill="currentColor"
      />
    </svg>
  );
};
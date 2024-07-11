'use client';
import React, { useEffect, useRef, Fragment, FC, useState, SetStateAction } from 'react';
import { OutputData } from '@editorjs/editorjs';
import { tools } from './tools';
import { Box, BoxProps } from '@mui/material';
import EditorJS from '@editorjs/editorjs';
import { MDImporter, MDParser } from './markdownParser';

import './editor.css';

// import dynamic from 'next/dynamic';
// const EditorJS = dynamic(() => import('@editorjs/editorjs'), { ssr: false })

interface TextEditorPropTypes extends BoxProps {
  value?: OutputData;
  setData?: (value: OutputData) => void;
  holder: string;
  placeholder?: string;
  readonly?: boolean;
  showMore?: boolean;
  setShowMore?: React.Dispatch<SetStateAction<boolean>> | any;
  isContentLarge?: boolean;
  setIsContentLarge?: React.Dispatch<SetStateAction<boolean>> | any;
  setContentHeight?: (height: number) => void;
  limit?: number;
}

const TextEditor: FC<TextEditorPropTypes> = ({
  value = { blocks: [] },
  setData = (value: OutputData) => {},
  holder = 'editorjs',
  children,
  limit = 5000,
  readonly = false,
  showMore = false,
  setShowMore,
  isContentLarge,
  setIsContentLarge,
  setContentHeight = () => { },
  ...props
}: TextEditorPropTypes) => {
  const ref: any = useRef();

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: holder,
        tools,
        data: value,
        readOnly: readonly,
        async onChange(api, event: any) {
          try {
            if (!readonly) {
              const data = await api.saver.save();
              setData(data);
              const contentLen = data.blocks
                .map((item) => item.data.text.length)
                .reduce((prev, current) => prev + current, 0);

              if (contentLen <= limit) {
                return;
              }

              if (event.detail) {
                const workingBlock = event.detail.target;
                const workingBlockIndex = event.detail.index;
                const workingBlockSaved = data.blocks
                  .filter((block) => block.id === workingBlock.id)
                  .pop();
                const otherBlocks = data.blocks.filter(
                  (block) => block.id !== workingBlock.id,
                );
                const otherBlocksLen = otherBlocks
                  .map((item) => item.data.text.length)
                  .reduce((prev, current) => prev + current, 0);
                const workingBlockLimit = limit - otherBlocksLen;
                if (workingBlockSaved) {
                  await api.blocks.update(workingBlock.id, {
                    text: workingBlockSaved.data.text.substr(
                      0,
                      workingBlockLimit,
                    ),
                  });
                  api.caret.setToBlock(workingBlockIndex, 'end');
                }
              }
              await api.saver.save();
            }
          } catch (err) {
            console.log('EditorJS Error: ', err);
          }
        },
        onReady: () => {
          const editorContent = document.querySelector('.codex-editor__redactor') as HTMLElement;
          if (editorContent) {
            setContentHeight(editorContent.scrollHeight);
            applyCustomStyles(editorContent.scrollHeight <= 300);
          }
        },
      });

      ref.current = editor;
    }

    return () => {
      if (ref.current && (ref.current as any).destroy) {
        (ref.current as any).destroy();
      }
    };
  }, []);

  const applyCustomStyles = (isPrimary: boolean) => {
    const editorContent = document.querySelector(
      '.codex-editor__redactor',
    ) as HTMLElement;
    if (editorContent) {
      editorContent.style.height = isPrimary ? 'fit-content' : '300px';
    }
  };

  useEffect(() => {
    const editorContent = document.querySelector('.codex-editor__redactor') as HTMLElement;
    if (editorContent) {
      applyCustomStyles(showMore || editorContent.scrollHeight <= 300);
    }
  }, [showMore]);

  return (
    <Fragment>
      {children ? children : <Box id={holder} {...props}></Box>}
    </Fragment>
  );
};

export default TextEditor;
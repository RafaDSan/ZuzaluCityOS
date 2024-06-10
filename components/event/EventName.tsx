import * as React from 'react';
import { Box, Stack, Typography, useTheme, useMediaQuery } from '@mui/material';
import { EventIcon, MapIcon } from 'components/icons';
import { convertDateStringFormat } from '@/utils';

interface PropTypes {
  spaceName?: string;
  eventName: string;
  eventDescription: string;
  startTime: string;
  endTime: string;
  location: string;
  image_url?: string;
  organizer: string;
}

const EventName = ({
  spaceName,
  eventName,
  eventDescription,
  endTime,
  startTime,
  location,
  image_url,
  organizer,
}: PropTypes) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  console.log("event", JSON.parse(eventDescription.replaceAll('\\"', '"')).blocks.map((item: any) => item.data.text).join(','))

  function isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <Stack spacing="10px">
      <Box
        component="img"
        width={isTablet ? '350px' : '350px'}
        height={isTablet ? '350px' : '350px'}
        src={image_url}
        borderRadius="10px"
        border="1px solid rgba(255, 255, 255, 0.2)"
      />
      {/*<Stack
        direction="row"
        padding="4px 10px"
        borderRadius="10px"
        border="1px solid #383838"
        width="fit-content"
        alignItems="center"
      >
        <Typography color="white" variant="caption">
          FEATURED IN:&nbsp;
        </Typography>
        <Typography color="white" variant="bodySB">
          HackZuzalu Side-events
  </Typography>
      </Stack>*/}
      <Typography color="white" variant="subtitleLB">
        {eventName}
      </Typography>
      <Typography color="white" variant="bodyM">
        {!isValidJSON(eventDescription.replaceAll('\\"', '"')) ?
          "JSON ERROR" : <Box component="pre" sx={{ fontFamily: "Inter" }}>{JSON.parse(eventDescription.replaceAll('\\"', '"')).blocks.map((item: any) => item.data.text).join('\n')}</Box>}
      </Typography>
      <Stack direction="row" spacing="5px" alignItems="center">
        <Typography color="white" variant="caption">
          BY:{organizer}
        </Typography>
        <Box component="img" width={20} height={20} src="/0.webp" />
        <Typography color="white" variant="bodyS">
          {spaceName}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Stack
          direction="row"
          padding={1}
          borderRadius="10px"
          alignItems="center"
          bgcolor="#292929"
        >
          <EventIcon />
        </Stack>
        <Typography color="white" variant="bodyMB">
          {convertDateStringFormat(startTime)} -{' '}
          {convertDateStringFormat(endTime)}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Stack
          direction="row"
          padding={1}
          borderRadius="10px"
          alignItems="center"
          bgcolor="#292929"
        >
          <MapIcon />
        </Stack>
        <Typography color="white" variant="bodyMB">
          {location ? location : 'N/A'}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default EventName;

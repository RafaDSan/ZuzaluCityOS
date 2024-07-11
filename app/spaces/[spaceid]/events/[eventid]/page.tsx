'use client';
import React, { useEffect, useState } from 'react';
import { Stack, useTheme, useMediaQuery } from '@mui/material';
import { About, Sessions } from './tabs';
import { IconSidebar, Header, Thumb, Sidebar } from './components';
import { CeramicResponseType, EventEdge, Event } from '@/types';
import { useCeramicContext } from '@/context/CeramicContext';
import { useParams } from 'next/navigation';

const Home = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.down('xl'));
  const params = useParams();

  const [tabName, setTabName] = useState<string>('About');
  const [eventData, setEventData] = useState<Event>();
  const [sessionView, setSessionView] = useState<boolean>(false);
  const { composeClient, ceramic } = useCeramicContext();
  const eventId = params.eventid.toString();
  const getEventDetailInfo = async () => {
    try {
      const response: CeramicResponseType<EventEdge> =
        (await composeClient.executeQuery(
          `
        query MyQuery($id: ID!) {
          node (id: $id) {
            ...on Event {
              createdAt
              description
              endTime
              external_url
              gated
              id
              image_url
              max_participant
              meeting_url
              min_participant
              participant_count
              profileId
              spaceId
              startTime
              status
              tagline
              timezone
              title
              tracks
              members{
              id
              }
              admins{
              id
              }
              space {
                id
                name
                gated
                avatar
                banner
                description
              }
              profile {
                username
                avatar
              }
              customLinks {
                title
                links
              }
            }
          }
        }
      `,
          {
            id: eventId,
          },
        )) as CeramicResponseType<EventEdge>;
      if (response.data) {
        if (response.data.node) {
          setEventData(response.data.node);
          return response.data.node;
        }
      }
    } catch (err) {
      console.log('Failed to fetch event: ', err);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventDetails = await getEventDetailInfo();
        const admins =
          eventDetails?.admins?.map((admin) => admin.id.toLowerCase()) || [];
        const members =
          eventDetails?.members?.map((member) => member.id.toLowerCase()) || [];
        const userDID = ceramic?.did?.parent.toString().toLowerCase() || '';
        if (admins.includes(userDID) || members.includes(userDID)) {
          setSessionView(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  return (
    <Stack
      direction="row"
      sx={{
        width: '100%',
        height: 'calc(100vh - 50px)',
      }}
    >
      {!isDesktop && <IconSidebar />}
      {!isDesktop && (
        <Sidebar
          spaceId={params.spaceid.toString()}
          title={eventData?.space?.name}
          avatar={eventData?.space?.avatar}
          banner={eventData?.space?.banner}
        />
      )}
      <Stack
        flex={1}
        borderLeft="1px solid #383838"
        sx={{
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <Header name={eventData?.title} spaceId={params.spaceid.toString()} />
        <Thumb
          tabName={tabName}
          setTabName={setTabName}
          canViewSessions={sessionView}
        />
        {tabName === 'About' && (
          <About eventData={eventData} setEventData={setEventData} />
        )}
        {tabName === 'Sessions' && <Sessions eventData={eventData} />}
      </Stack>
    </Stack>
  );
};

export default Home;
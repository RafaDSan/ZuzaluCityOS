'use client';
import SlotDates from '@/components/calendar/SlotDate';
import {
  EventCard,
  EventCardMonthGroup,
  EventCardSkeleton,
  groupEventsByMonth,
} from '@/components/cards/EventCard';
import { SpaceCardSkeleton } from '@/components/cards/SpaceCard';
import { ZuCalendar } from '@/components/core';
import { dashboardEvent, isDev, prodShowSpaceId } from '@/constant';
import { useCeramicContext } from '@/context/CeramicContext';
import { Event, EventData, Space, SpaceData } from '@/types';
import { Dayjs, dayjs } from '@/utils/dayjs';
import {
  Box,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Carousel from 'components/Carousel';
import { EventIcon, RightArrowCircleIcon, SpaceIcon } from 'components/icons';
import { Sidebar } from 'components/layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { EventComingSoonCard } from '@/components/cards/ComingSoonCard';
import { getSpacesQuery } from '@/services/space';
import Banner from './components/Banner';
import { supabase } from '@/utils/supabase/client';
import { LegacyEvent } from '@/types';

const Home: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState<boolean>(true);
  const [eventsForCalendar, setEventsForCalendar] = useState<Event[]>([]);
  const [isPast, setIsPast] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [targetEventView, setTargetEventView] = useState<boolean>(false);
  const [targetEvent, setTargetEvent] = useState<Event>();

  const [dateForCalendar, setDateForCalendar] = useState<Dayjs>(
    dayjs(new Date()),
  );

  const {
    ceramic,
    composeClient,
    isAuthenticated,
    authenticate,
    logout,
    showAuthPrompt,
    hideAuthPrompt,
    isAuthPromptVisible,
    newUser,
    profile,
    username,
    createProfile,
  } = useCeramicContext();

  const getSpaces = async () => {
    try {
      const response: any = await composeClient.executeQuery(getSpacesQuery);
      if ('zucitySpaceIndex' in response.data) {
        const spaceData: SpaceData = response.data as SpaceData;
        let fetchedSpaces: Space[] = spaceData.zucitySpaceIndex.edges.map(
          (edge) => edge.node,
        );
        const shuffledSpaces = [...fetchedSpaces].sort(
          () => Math.random() - 0.5,
        );
        setSpaces(shuffledSpaces);
      } else {
        console.error('Invalid data structure:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  const getEvents = async () => {
    try {
      setIsEventsLoading(true);

      const ceramicResponse: any = await composeClient.executeQuery(`
      query {
        zucityEventIndex(first: 20, sorting: { createdAt: DESC }) {
          edges {
            node {
              createdAt
              description
              endTime
              externalUrl
              gated
              id
              imageUrl
              meetingUrl
              profileId
              spaceId
              startTime
              status
              tagline
              timezone
              title
              members{
              id
              }
              admins{
              id
              }
              superAdmin{
              id
              }
              profile {
                username
                avatar
              }
              space {
                name
                avatar
              }
              tracks
            }
          }
        }
      }
    `);

      const { data: legacyEvents, error } = await supabase
        .from('legacyEvents')
        .select('*');

      if (error) throw error;

      let allEvents: Event[] = [];
      if (ceramicResponse?.data?.zucityEventIndex) {
        const ceramicEvents: Event[] =
          ceramicResponse.data.zucityEventIndex.edges.map((edge: any) => ({
            ...edge.node,
            source: 'ceramic',
          }));
        allEvents = [...ceramicEvents];
      }

      if (legacyEvents) {
        const convertedLegacyEvents: Event[] = legacyEvents
          .filter((legacy): legacy is NonNullable<typeof legacy> => !!legacy.id)
          .map((legacy) => ({
            id: legacy.id,
            title: legacy.name ?? '',
            description: legacy.description ?? '',
            startTime: legacy.start_date ?? '',
            endTime: legacy.end_date ?? '',
            status: legacy.status ?? '',
            tagline: legacy.tagline ?? '',
            imageUrl: legacy.image_url ?? '',
            profileId: '',
            spaceId: '',
            timezone: 'UTC',
            tracks: legacy.event_type || [],
            source: 'Legacy',
            participantCount: 0,
            minParticipant: 0,
            maxParticipant: 0,
            createdAt: legacy.start_date,
            gated: false,
            externalUrl: '',
            meetingUrl: '',
            legacyData: {
              event_space_type: legacy.event_space_type,
              format: legacy.format,
              experience_level: legacy.experience_level,
              social_links: legacy.social_links,
              extra_links: legacy.extra_links,
            },
          }));
        allEvents = [...allEvents, ...convertedLegacyEvents];
      }

      allEvents.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );

      setEvents(allEvents);
      setIsEventsLoading(false);

      const getEvent = allEvents.find((event) => event.id === dashboardEvent);
      if (getEvent) {
        setTargetEvent(getEvent);
        const userDid = ceramic.did?.parent.toString().toLowerCase() || '';
        if (getEvent) {
          const memberIds = new Set(
            getEvent.members?.map((member) => member.id.toLowerCase()),
          );
          const adminIds = new Set(
            getEvent.admins?.map((admin) => admin.id.toLowerCase()),
          );
          const superAdminIds = new Set(
            getEvent.superAdmin?.map((sa) => sa.id.toLowerCase()),
          );

          const canView =
            memberIds.has(userDid) ||
            adminIds.has(userDid) ||
            superAdminIds.has(userDid);
          if (canView) {
            setTargetEventView(canView);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setIsEventsLoading(false);
    }
  };

  const getEventsByDate = async () => {
    try {
      // TODO: clean selectedDate
      if (selectedDate) {
        const getEventsByDate_QUERY = `
          query ($input:ZucityEventFiltersInput!) {
          zucityEventIndex(filters:$input, first: 20){
            edges {
              node {
                createdAt
                description
                endTime
                externalUrl
                gated
                id
                imageUrl
                meetingUrl
                profileId
                spaceId
                startTime
                status
                tagline
                timezone
                title
                profile {
                  username
                  avatar
                }
                tracks
              }
            }
          }
        }
      `;
        setIsEventsLoading(true);
        const response: any = await composeClient.executeQuery(
          getEventsByDate_QUERY,
          {
            input: {
              where: {
                startTime: {
                  equalTo: selectedDate.format('YYYY-MM-DD') + 'T00:00:00Z',
                },
              },
            },
          },
        );
        if (response && response.data && 'zucityEventIndex' in response.data) {
          const eventData: EventData = response.data as EventData;
          const fetchedEvents: Event[] = eventData.zucityEventIndex.edges.map(
            (edge) => edge.node,
          );
          setEvents(fetchedEvents);
        } else {
          console.error('Invalid data structure:', response.data);
        }
        setIsEventsLoading(false);
      }
    } catch (error) {
      setIsEventsLoading(false);
      console.error('Failed to fetch events:', error);
    }
  };

  const getEventsInMonth = async () => {
    const getEventsByDate_QUERY = `
        query ($input:ZucityEventFiltersInput!) {
        zucityEventIndex(filters:$input, first: 20){
          edges {
            node {
              description
              externalUrl
              gated
              imageUrl
              meetingUrl
              profileId
              spaceId
              status
              tagline
              timezone
              title
              profile {
                username
                avatar
              }
              createdAt
              endTime
              id
              startTime
              tracks
            }
          }
        }
      }
    `;
    const response: any = await composeClient.executeQuery(
      getEventsByDate_QUERY,
      {
        input: {
          where: {
            startTime: {
              lessThanOrEqualTo: dateForCalendar
                ?.endOf('month')
                .format('YYYY-MM-DDTHH:mm:ss[Z]'),
              greaterThanOrEqualTo: dateForCalendar
                ?.startOf('month')
                .format('YYYY-MM-DDTHH:mm:ss[Z]'),
            },
          },
        },
      },
    );
    if (response && response.data && 'zucityEventIndex' in response.data) {
      const eventData: EventData = response.data as EventData;
      const fetchedEvents: Event[] = eventData.zucityEventIndex.edges.map(
        (edge) => edge.node,
      );
      setEventsForCalendar(fetchedEvents);
    } else {
      console.error('Invalid data structure:', response.data);
    }
  };

  useEffect(() => {
    document.title = 'Zuzalu City';
    Promise.all([getSpaces(), getEvents()]).catch((error) => {
      console.error('An error occurred:', error);
    });
  }, [ceramic.did?.parent]);

  useEffect(() => {
    getEventsByDate().catch((error) => {
      console.error('An error occurred:', error);
    });
  }, [selectedDate]);

  useEffect(() => {
    getEventsInMonth().catch((e) => {
      console.error('Failed to fetch events:', e);
    });
  }, [dateForCalendar]);

  const eventsData = useMemo(() => {
    const data = groupEventsByMonth(events);
    let keys = Object.keys(data).sort((a, b) => {
      const dateA = dayjs(a, 'MMMM YYYY');
      const dateB = dayjs(b, 'MMMM YYYY');
      return dateA.isBefore(dateB) ? 1 : -1;
    });

    const invalidDateIndex = keys.findIndex((key) => key === 'Invalid Date');
    if (invalidDateIndex !== -1) {
      const invalidDate = keys.splice(invalidDateIndex, 1)[0];
      keys.push(invalidDate);
    }

    const groupedEvents: { [key: string]: Event[] } = {};
    keys.forEach((key) => {
      const value = data[key];
      value.sort((a, b) => {
        const dateA = dayjs(a.startTime);
        const dateB = dayjs(b.startTime);
        return dateA.isAfter(dateB) ? 1 : -1;
      });
      groupedEvents[key] = value;
    });
    return groupedEvents;
  }, [events]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box width={'100vw'} minHeight={'calc(100vh - 50px)'}>
        <Box
          display="grid"
          gridTemplateColumns={'auto 1fr'}
          sx={{
            backgroundColor: 'rgba(34, 34, 34, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
          height={'calc(100vh - 50px)'}
        >
          {!isTablet && <Sidebar selected="Home" />}
          <Box
            flex={1}
            padding={isMobile ? '10px' : '30px'}
            width={isTablet ? '100vw' : 'calc(100vw - 260px)'}
            height={'100%'}
            sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
              maxWidth: '1160px',
              margin: '0 auto',
            }}
          >
            <Banner />
            <Box marginTop="30px">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  backgroundColor: 'rgba(34, 34, 34, 0.9)',
                  backdropFilter: 'blur(10px)',
                  position: 'sticky',
                  top: '-30px',
                  zIndex: 100,
                }}
              >
                <Box display="flex" alignItems="center" gap="10px">
                  <SpaceIcon />
                  <Typography
                    variant={isMobile ? 'subtitleMB' : 'subtitleLB'}
                    color="white"
                  >
                    Communities
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap="10px"
                  onClick={() => router.push('/spaces')}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography color="white" variant="bodyM">
                    View All Spaces
                  </Typography>
                  <RightArrowCircleIcon />
                </Box>
              </Box>
              <Box margin="0 0 20px">
                <Typography
                  color="white"
                  variant="bodyM"
                  sx={{ opacity: '0.5', fontSize: '12px' }}
                >
                  Random Spaces
                </Typography>
              </Box>
              {spaces.length > 0 ? (
                <Carousel items={spaces} />
              ) : (
                <Box display={'flex'} gap={'10px'}>
                  <SpaceCardSkeleton></SpaceCardSkeleton>
                  <SpaceCardSkeleton></SpaceCardSkeleton>
                  <SpaceCardSkeleton></SpaceCardSkeleton>
                  <SpaceCardSkeleton></SpaceCardSkeleton>
                </Box>
              )}
            </Box>
            <Box display="flex" gap="20px" marginTop="20px">
              <Box
                position="relative"
                flexGrow={1}
                display="flex"
                flexDirection="column"
                gap="20px"
                sx={{ inset: '0' }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(34, 34, 34, 0.9)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky',
                    top: '-30px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap="10px">
                      <EventIcon />
                      <Typography color="white" variant="subtitleLB">
                        Events
                      </Typography>
                    </Box>
                    <Link
                      href={'/events'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'blink',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap="10px">
                        <Typography color="white" variant="bodyB">
                          View All Events
                        </Typography>
                        <RightArrowCircleIcon />
                      </Box>
                    </Link>
                  </Box>
                </Box>
                {isEventsLoading ? (
                  <>
                    <EventCardMonthGroup>
                      <Skeleton width={60}></Skeleton>
                    </EventCardMonthGroup>
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                  </>
                ) : events.length === 0 ? (
                  <Box
                    display={'flex'}
                    height={200}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    <Typography color={'#ccc'}>
                      No data at the moment
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {Object.entries(eventsData).map(([month, eventsList]) => {
                      return (
                        <Fragment key={month}>
                          <EventCardMonthGroup>{month}</EventCardMonthGroup>
                          {eventsList.map((event, index) => (
                            <EventCard
                              key={`EventCard-${index}`}
                              event={event}
                            />
                          ))}
                        </Fragment>
                      );
                    })}
                    {/*<EventComingSoonCard />*/}
                  </>
                )}
              </Box>
              <Box>
                {!isTablet && (
                  <Box
                    width="360px"
                    display="flex"
                    flexDirection="column"
                    gap="20px"
                    sx={{
                      position: 'sticky',
                      top: 60,
                    }}
                  >
                    <Typography
                      color="white"
                      variant="subtitleS"
                      padding="20px 10px"
                      borderBottom="1px solid #383838"
                    >
                      Sort & Filter Events
                    </Typography>
                    {/*<Box
                        display="flex"
                        gap="4px"
                        padding="2px"
                        borderRadius="10px"
                        bgcolor="#2d2d2d"
                      >
                        <Button
                          sx={{
                            flex: 1,
                            backgroundColor: isPast ? '#2d2d2d' : '#424242',
                            borderRadius: '8px',
                            color: 'white',
                            fontFamily: 'Inter',
                          }}
                          onClick={() => setIsPast(false)}
                        >
                          Upcoming
                        </Button>
                        <Button
                          sx={{
                            flex: 1,
                            backgroundColor: isPast ? '#424242' : '#2d2d2d',
                            borderRadius: '8px',
                            color: 'white',
                            fontFamily: 'Inter',
                          }}
                          onClick={() => setIsPast(true)}
                        >
                          Past
                        </Button>
                      </Box>
                      */}
                    <Box>
                      <ZuCalendar
                        onChange={(val) => {
                          setSelectedDate(val);
                        }}
                        slots={{ day: SlotDates }}
                        slotProps={{
                          day: {
                            highlightedDays: eventsForCalendar
                              .filter((event) => {
                                // filter event.startTime month equal to selected month
                                return (
                                  dayjs(event.startTime).month() ===
                                    dateForCalendar.month() &&
                                  dayjs(event.startTime).year() ===
                                    dateForCalendar.year()
                                );
                              })
                              .filter((event) => {
                                if (selectedDate) {
                                  return (
                                    dayjs(event.startTime).date() !==
                                    selectedDate.date()
                                  );
                                }
                                return true;
                              })

                              .map((event) => {
                                return dayjs(event.startTime).date();
                              }),
                          } as any,
                        }}
                        onMonthChange={(val) => setDateForCalendar(val)}
                        onYearChange={(val) => setDateForCalendar(val)}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Home;

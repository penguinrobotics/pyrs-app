import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";
import ReactTimeAgo from "react-time-ago";
import {
  Box,
  Callout,
  Card,
  Flex,
  Grid,
  Inset,
  Separator,
  Spinner,
  Table,
  Text,
} from "@radix-ui/themes";
import { usePyrsAppData } from "../../lib/usePyrsAppData";

const QueuePage = () => {
  const [flash, setFlash] = useState(false);
  const prevNowServingLength = useRef(0);
  const [judgingSchedule, setJudgingSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);

  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected } = usePyrsAppData();

  let blinkInterval;

  const flashRed = () => {
    let count = 0;
    blinkInterval = setInterval(() => {
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
      }, 400);
      if (count++ === 4) clearInterval(blinkInterval);
    }, 800);
  };

  // Flash red when a new team is added to nowServing
  useEffect(() => {
    if (nowServing.length > prevNowServingLength.current) {
      flashRed();
    }
    prevNowServingLength.current = nowServing.length;
  }, [nowServing]);

  // Fetch judging schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch('/api/judging/schedule');
        if (response.ok) {
          const data = await response.json();
          setJudgingSchedule(data.schedule || []);
        }
      } catch (error) {
        console.error('Failed to fetch judging schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  // Filter past time slots and update every 30 seconds
  useEffect(() => {
    const filterSchedule = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const filtered = judgingSchedule.filter((slot) => {
        // Parse time string (e.g., "9:30 AM")
        const timeMatch = slot.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return true;

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const meridiem = timeMatch[3].toUpperCase();

        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        const slotTime = hours * 60 + minutes;
        return slotTime >= currentTime;
      });

      setFilteredSchedule(filtered);
    };

    filterSchedule();
    const interval = setInterval(filterSchedule, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [judgingSchedule]);

  return (
    <>
      <Head>
        <title>PYRS App - Queue</title>
        <style>{`
          @keyframes scrollJudging {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-50%);
            }
          }
          .judging-scroll:hover {
            animation-play-state: paused;
          }
          @keyframes scrollQueue {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-50%);
            }
          }
          .queue-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </Head>
      <Flex direction="column" gap="6" style={{ height: "90vh" }}>
        {/* Skills Queue Section - 55% */}
        <Flex direction="column" gap="4" style={{ height: "55%", overflow: "hidden" }}>
          <Flex direction="row" align="center" justify="center" gap="4">
            <Text weight="bold" size="8" align="center">
              Skills Queue
            </Text>
          </Flex>
          <Flex direction="row" gap="6" style={{ flex: 1, overflow: "hidden" }}>
            <Flex width="600px" gap="4" direction="column">
              <Card style={{ backgroundColor: "rgba(0,130,255,1)" }}>
                <Inset>
                  <Callout.Root
                    size="1"
                    variant="surface"
                    style={{
                      justifyContent: "center",
                      backgroundColor: "white",
                      border: "none"
                    }}
                  >
                    <Flex direction="row" align="center" justify="center" gap="2">
                      <Text weight="bold" size="5" align="center">
                        Up Next
                      </Text>
                    </Flex>
                  </Callout.Root>
                  <Box
                    style={{
                      backgroundColor: flash ? "transparent" : "rgb(0,130,255)",
                      minHeight: "300px",
                      overflow: "hidden",
                      position: "relative"
                    }}
                    p="4"
                  >
                    {nowServing.length > 0 ? (
                      <>
                        {/* Pinned header */}
                        <Box style={{ position: "relative", zIndex: 10, backgroundColor: "rgb(0,130,255)" }}>
                          <Table.Root size="1" variant="ghost" style={{ color: "white", tableLayout: "fixed", width: "100%" }}>
                            <colgroup>
                              <col style={{ width: "33.33%" }} />
                              <col style={{ width: "33.33%" }} />
                              <col style={{ width: "33.34%" }} />
                            </colgroup>
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeaderCell style={{ color: "white" }}>
                                  <Text size="5" style={{ color: "white" }}>Team #</Text>
                                </Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell style={{ color: "white" }}>
                                  <Text size="5" style={{ color: "white" }}>Field</Text>
                                </Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell style={{ color: "white" }}>
                                  <Text size="5" style={{ color: "white" }}>Time Past</Text>
                                </Table.ColumnHeaderCell>
                              </Table.Row>
                            </Table.Header>
                          </Table.Root>
                        </Box>
                        {/* Scrolling body container */}
                        <Box style={{ overflow: "hidden", position: "relative", flex: 1 }}>
                          <Box
                            className="queue-scroll"
                            style={{
                              animation: nowServing.length > 3 ? "scrollQueue 30s linear infinite" : "none"
                            }}
                          >
                            <Table.Root size="1" variant="ghost" style={{ color: "white", tableLayout: "fixed", width: "100%" }}>
                              <colgroup>
                                <col style={{ width: "33.33%" }} />
                                <col style={{ width: "33.33%" }} />
                                <col style={{ width: "33.34%" }} />
                              </colgroup>
                              <Table.Body>
                                {/* First loop of content */}
                                {nowServing.map((team, index) => (
                                  <Table.Row key={`first-${index}`}>
                                    <Table.Cell>
                                      <Text size="7" style={{ color: "white" }} weight="bold">
                                        {team.number}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="7" style={{ color: "white" }} weight="bold">
                                        {team.field || "-"}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="7" style={{ color: "white" }} weight="bold">
                                        <ReactTimeAgo
                                          date={team.at ? new Date(team.at) : new Date()}
                                          locale="en-US"
                                          timeStyle="mini"
                                        />
                                      </Text>
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                                {/* Second loop for seamless scrolling */}
                                {nowServing.length > 3 && nowServing.map((team, index) => (
                                  <Table.Row key={`second-${index}`}>
                                    <Table.Cell>
                                      <Text size="7" style={{ color: "white" }} weight="bold">
                                        {team.number}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="7" style={{ color: "white" }} weight="bold">
                                        {team.field || "-"}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="7" style={{ color: "white" }} weight="bold">
                                        <ReactTimeAgo
                                          date={team.at ? new Date(team.at) : new Date()}
                                          locale="en-US"
                                          timeStyle="mini"
                                        />
                                      </Text>
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table.Root>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Flex align="center" justify="center" style={{ height: "100%" }}>
                        <Text size="5" style={{ color: "white" }}>No teams up next</Text>
                      </Flex>
                    )}
                  </Box>
                </Inset>
              </Card>
            </Flex>

            <Flex gap="4" direction="column" width="100%">
              <Card>
                <Inset>
                  <Callout.Root
                    size="1"
                    variant="surface"
                    style={{ justifyContent: "center" }}
                  >
                    <Flex direction="row" align="center" justify="center" gap="2">
                      <Text weight="bold" size="5" align="center">
                        Current Queue
                      </Text>
                      <Spinner size="2" />
                    </Flex>
                  </Callout.Root>
                  <Box minHeight="300px" px="4">
                    <ol>
                      <Grid columns="5" gap="2">
                        {queue.map((team, index) => (
                          <li
                            key={index}
                            style={{ listStyle: "decimal", fontSize: "22px" }}
                          >
                            <Text size="6" weight="bold">
                              {team.number}
                            </Text>
                          </li>
                        ))}
                      </Grid>
                    </ol>
                  </Box>
                </Inset>
              </Card>
            </Flex>
          </Flex>
        </Flex>

        {/* Judging Queue Section - 45% */}
        <Flex direction="column" gap="4" style={{ height: "45%", overflow: "hidden" }}>
          <Flex direction="row" align="center" justify="center" gap="4">
            <Text weight="bold" size="8" align="center">
              Judging Queue
            </Text>
          </Flex>
          <Card style={{ flex: 1, overflow: "hidden" }}>
            <Inset>
              <Box style={{ height: "100%", overflow: "hidden", position: "relative" }}>
                {filteredSchedule.length > 0 ? (
                  <>
                    {/* Pinned first 2 rows */}
                    <Box style={{
                      position: "relative",
                      zIndex: 10,
                      backgroundColor: "var(--color-background)",
                      borderBottom: "2px solid var(--gray-6)"
                    }}>
                      <Table.Root size="2" variant="surface">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeaderCell style={{ width: "120px" }}>
                              <Text size="5" weight="bold">Time</Text>
                            </Table.ColumnHeaderCell>
                            {filteredSchedule[0]?.teams.map((_, panelIndex) => (
                              <Table.ColumnHeaderCell key={panelIndex} style={{ width: "150px" }}>
                              </Table.ColumnHeaderCell>
                            ))}
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {filteredSchedule.slice(0, 2).map((slot, index) => (
                            <Table.Row key={index} style={{ backgroundColor: index === 0 ? "lightgreen" : "transparent" }}>
                              <Table.Cell>
                                <Text size="6" weight="bold">{slot.time}</Text>
                              </Table.Cell>
                              {slot.teams.map((team, teamIndex) => (
                                <Table.Cell key={teamIndex}>
                                  <Text size="5" weight="medium">{team}</Text>
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>

                    {/* Scrolling section for remaining rows */}
                    {filteredSchedule.length > 2 && (
                      <Box
                        style={{
                          height: "calc(100% - 200px)",
                          overflow: "hidden",
                          position: "relative"
                        }}
                      >
                        <Box
                          className="judging-scroll"
                          style={{
                            animation: "scrollJudging 30s linear infinite",
                            paddingTop: "10px"
                          }}
                        >
                          <Table.Root size="2" variant="surface">
                            <Table.Body>
                              {/* First loop of content */}
                              {filteredSchedule.slice(2).map((slot, index) => (
                                <Table.Row key={`first-${index}`}>
                                  <Table.Cell style={{ width: "120px" }}>
                                    <Text size="6" weight="bold">{slot.time}</Text>
                                  </Table.Cell>
                                  {slot.teams.map((team, teamIndex) => (
                                    <Table.Cell key={teamIndex} style={{ width: "150px" }}>
                                      <Text size="5" weight="medium">{team}</Text>
                                    </Table.Cell>
                                  ))}
                                </Table.Row>
                              ))}
                              {/* Second loop for seamless scrolling */}
                              {filteredSchedule.slice(2).map((slot, index) => (
                                <Table.Row key={`second-${index}`}>
                                  <Table.Cell style={{ width: "120px" }}>
                                    <Text size="6" weight="bold">{slot.time}</Text>
                                  </Table.Cell>
                                  {slot.teams.map((team, teamIndex) => (
                                    <Table.Cell key={teamIndex} style={{ width: "150px" }}>
                                      <Text size="5" weight="medium">{team}</Text>
                                    </Table.Cell>
                                  ))}
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  <Flex align="center" justify="center" style={{ height: "100%" }}>
                    <Text size="5" color="gray">No upcoming judging slots</Text>
                  </Flex>
                )}
              </Box>
            </Inset>
          </Card>
        </Flex>
      </Flex>
    </>
  );
};

export default QueuePage;

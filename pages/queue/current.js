import React, { useEffect, useState, useRef, memo, useMemo, useCallback } from "react";
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
import { DoubleArrowUpIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { usePyrsAppData } from "../../lib/usePyrsAppData";
import { calculateQueueStatus } from "../../lib/queueCapacity";

const Marker = ({ color, children }) => {
  return (
    <Box
      style={{
        backgroundColor: `var(--${color}-3)`,
        border: `2px solid var(--${color}-11)`,
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: `var(--${color}-11)`,
      }}
    >
      {children}
    </Box>
  );
};

// Memoized component for "Up Next" table
const NowServingTable = memo(({ nowServing, flashingTeams }) => {
  // Only enable scrolling if there are more than 5 teams (enough to overflow the container)
  const shouldScroll = nowServing.length > 5;

  const isFlashing = (teamNumber) => flashingTeams.has(teamNumber);
  const rowStyle = (teamNumber) => ({
    backgroundColor: isFlashing(teamNumber) ? "var(--blue-10)" : "transparent",
  });
  const textColor = (teamNumber) => isFlashing(teamNumber) ? "white" : "black";

  return (
    <Box
      style={{
        backgroundColor: "var(--blue-5)",
        minHeight: "300px",
        overflow: "hidden",
        position: "relative"
      }}
      p="4"
    >
      {nowServing.length > 0 ? (
        <>
          {/* Pinned header */}
          <Box style={{ position: "relative", zIndex: 10, backgroundColor: "var(--blue-5)" }}>
            <Table.Root size="1" variant="ghost" style={{ color: "black", tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "33.33%" }} />
                <col style={{ width: "33.33%" }} />
                <col style={{ width: "33.34%" }} />
              </colgroup>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell style={{ color: "black" }}>
                    <Text size="5" style={{ color: "black" }}>Team #</Text>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ color: "black" }}>
                    <Text size="5" style={{ color: "black" }}>Field</Text>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ color: "black" }}>
                    <Text size="5" style={{ color: "black" }}>Time Past</Text>
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
                animation: shouldScroll ? "scrollQueue 30s linear infinite" : "none"
              }}
            >
              <Table.Root size="1" variant="ghost" style={{ color: "black", tableLayout: "fixed", width: "100%" }}>
                <colgroup>
                  <col style={{ width: "33.33%" }} />
                  <col style={{ width: "33.33%" }} />
                  <col style={{ width: "33.34%" }} />
                </colgroup>
                <Table.Body>
                  {/* First loop of content */}
                  {nowServing.map((team, index) => (
                    <Table.Row key={`first-${index}`} style={rowStyle(team.number)}>
                      <Table.Cell>
                        <Text size="7" style={{ color: textColor(team.number) }} weight="bold">
                          {team.number}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="7" style={{ color: textColor(team.number) }} weight="bold">
                          {team.field || "-"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="7" style={{ color: textColor(team.number) }} weight="bold">
                          <ReactTimeAgo
                            date={team.at ? new Date(team.at) : new Date()}
                            locale="en-US"
                            timeStyle="mini"
                            updateInterval={5000}
                          />
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {/* Blank row separator when scrolling */}
                  {shouldScroll && (
                    <Table.Row key="blank-separator" style={{ height: "0.5em" }}>
                      <Table.Cell style={{ padding: "0.25em" }}>
                        <Text size="7" style={{ color: "transparent" }}>-</Text>
                      </Table.Cell>
                      <Table.Cell style={{ padding: "0.25em" }}>
                        <Text size="7" style={{ color: "transparent" }}>-</Text>
                      </Table.Cell>
                      <Table.Cell style={{ padding: "0.25em" }}>
                        <Text size="7" style={{ color: "transparent" }}>-</Text>
                      </Table.Cell>
                    </Table.Row>
                  )}
                  {/* Second loop for seamless scrolling - only duplicate if scrolling is enabled */}
                  {shouldScroll && nowServing.map((team, index) => (
                    <Table.Row key={`second-${index}`} style={rowStyle(team.number)}>
                      <Table.Cell>
                        <Text size="7" style={{ color: textColor(team.number) }} weight="bold">
                          {team.number}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="7" style={{ color: textColor(team.number) }} weight="bold">
                          {team.field || "-"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="7" style={{ color: textColor(team.number) }} weight="bold">
                          <ReactTimeAgo
                            date={team.at ? new Date(team.at) : new Date()}
                            locale="en-US"
                            timeStyle="mini"
                            updateInterval={5000}
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
          <Text size="5" style={{ color: "black" }}>No teams up next</Text>
        </Flex>
      )}
    </Box>
  );
});

// Memoized component for "Current Queue" list
const CurrentQueueList = memo(({ queue, getTeamIconButton }) => {
  return (
    <Box minHeight="300px" px="4">
      <ol>
        <Grid columns="5" gap="2">
          {queue.map((team, index) => (
            <li
              key={index}
              style={{ listStyle: "decimal", fontSize: "22px" }}
            >
              <Flex direction="row" align="center" gap="2">
                <Text size="6" weight="bold">
                  {team.number}
                </Text>
                {getTeamIconButton(team.number)}
              </Flex>
            </li>
          ))}
        </Grid>
      </ol>
    </Box>
  );
});

// Memoized component for "Judging Queue" table
const JudgingScheduleTable = memo(({ filteredSchedule, getTimeSlotIconButton }) => {
  return (
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
                  <Table.ColumnHeaderCell style={{ width: "180px" }}>
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
                      <Flex direction="row" align="center" gap="2">
                        <Text size="6" weight="bold">{slot.time}</Text>
                        {getTimeSlotIconButton(index)}
                      </Flex>
                    </Table.Cell>
                    {slot.teams.map((team, teamIndex) => (
                      <Table.Cell key={teamIndex}>
                        <Text size="6" weight="bold">{team}</Text>
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
                        <Table.Cell style={{ width: "180px" }}>
                          <Text size="6" weight="bold">{slot.time}</Text>
                        </Table.Cell>
                        {slot.teams.map((team, teamIndex) => (
                          <Table.Cell key={teamIndex} style={{ width: "150px" }}>
                            <Text size="6" weight="bold">{team}</Text>
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                    {/* Blank row separator for scrolling */}
                    {filteredSchedule.length > 2 && filteredSchedule[0]?.teams && (
                      <Table.Row key="blank-separator" style={{ height: "0.5em" }}>
                        <Table.Cell style={{ width: "180px", padding: "0.25em" }}>
                          <Text size="6" style={{ color: "transparent" }}>-</Text>
                        </Table.Cell>
                        {filteredSchedule[0].teams.map((_, teamIndex) => (
                          <Table.Cell key={teamIndex} style={{ width: "150px", padding: "0.25em" }}>
                            <Text size="6" style={{ color: "transparent" }}>-</Text>
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    )}
                    {/* Second loop for seamless scrolling */}
                    {filteredSchedule.slice(2).map((slot, index) => (
                      <Table.Row key={`second-${index}`}>
                        <Table.Cell style={{ width: "180px" }}>
                          <Text size="6" weight="bold">{slot.time}</Text>
                        </Table.Cell>
                        {slot.teams.map((team, teamIndex) => (
                          <Table.Cell key={teamIndex} style={{ width: "150px" }}>
                            <Text size="6" weight="bold">{team}</Text>
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
  );
});

const QueuePage = () => {
  const [flashingTeams, setFlashingTeams] = useState(new Set());
  const prevNowServingTeams = useRef(new Set());
  const isInitialMount = useRef(true);
  const [judgingSchedule, setJudgingSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);

  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected, queueSettings } = usePyrsAppData();

  // Calculate queue status
  const queueStatus = useMemo(() => {
    if (!queueSettings) return null;
    return calculateQueueStatus(queueSettings, { nowServing, queue });
  }, [queueSettings, nowServing, queue]);

  const flashRows = (newTeams) => {
    let count = 0;
    const interval = setInterval(() => {
      setFlashingTeams(new Set(newTeams));
      setTimeout(() => {
        setFlashingTeams(new Set());
      }, 700);
      if (count++ === 5) clearInterval(interval);
    }, 1100);
  };

  // Flash rows when new teams are added to nowServing
  useEffect(() => {
    // Skip flash on initial mount to avoid flashing when loading existing state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevNowServingTeams.current = new Set(nowServing.map(t => t.number));
      return;
    }

    const currentTeams = new Set(nowServing.map(t => t.number));
    const previousTeams = prevNowServingTeams.current;

    // Find which teams are new
    const newTeams = Array.from(currentTeams).filter(team => !previousTeams.has(team));

    if (newTeams.length > 0) {
      flashRows(newTeams);
    }

    prevNowServingTeams.current = currentTeams;
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

  // Helper function to get icon for time slots in judging table
  const getTimeSlotIconButton = useCallback((slotIndex) => {
    if (slotIndex === 0) {
      return (
        <Marker color="green">
          <DoubleArrowUpIcon />
        </Marker>
      );
    }
    if (slotIndex === 1) {
      return (
        <Marker color="yellow">
          <ChevronUpIcon />
        </Marker>
      );
    }
    return null;
  }, []);

  // Helper function to get icon for teams in skills queue
  const getTeamIconButton = useCallback((teamNumber) => {
    const slotIndex = filteredSchedule.findIndex(slot =>
      slot.teams.includes(teamNumber)
    );
    if (slotIndex === 0) {
      return (
        <Marker color="green">
          <DoubleArrowUpIcon />
        </Marker>
      );
    }
    if (slotIndex === 1) {
      return (
        <Marker color="yellow">
          <ChevronUpIcon />
        </Marker>
      );
    }
    return null;
  }, [filteredSchedule]);

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
        {/* Skills Queue Section - 55% (or 100% when no judging schedule) */}
        <Flex direction="column" gap="4" style={{ height: judgingSchedule.length === 0 ? "100%" : "55%", overflow: "hidden" }}>
          <Flex direction="row" align="center" justify="center" gap="4">
            <Text weight="bold" size="8" align="center">
              Skills Queue
            </Text>
          </Flex>
          <Flex direction="row" gap="6" style={{ flex: 1, overflow: "hidden" }}>
            <Flex width="600px" gap="4" direction="column">
              <Card style={{ backgroundColor: "var(--blue-5)" }}>
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
                  <NowServingTable nowServing={nowServing} flashingTeams={flashingTeams} />
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
                    <Flex direction="column" align="center" justify="center" gap="1">
                      <Flex direction="row" align="center" justify="center" gap="2">
                        <Text weight="bold" size="5" align="center">
                          Current Queue
                        </Text>
                        <Spinner size="2" />
                      </Flex>
                      {queueStatus && (
                        <Text size="2" style={{ color: "black" }}>
                          Skills closes at: <Text weight="bold">{queueSettings?.skillsCutoffTime?.replace(/^\d{1,2}\/\d{1,2}\s+/, '') || "N/A"}</Text>,{" "}
                          {queueStatus.remainingSlots > 0 ? (
                            <>spots remaining: <Text weight="bold">{queueStatus.remainingSlots === Infinity ? "Unlimited" : queueStatus.remainingSlots}</Text></>
                          ) : (
                            <Text weight="bold" style={{ color: "var(--red-11)" }}>Queue is now closed</Text>
                          )}
                        </Text>
                      )}
                    </Flex>
                  </Callout.Root>
                  <CurrentQueueList queue={queue} getTeamIconButton={getTeamIconButton} />
                </Inset>
              </Card>
            </Flex>
          </Flex>
        </Flex>

        {/* Judging Queue Section - 45% (hidden when no schedule) */}
        {judgingSchedule.length > 0 && (
          <Flex direction="column" gap="4" style={{ height: "45%", overflow: "hidden" }}>
            <Flex direction="row" align="center" justify="center" gap="4">
              <Text weight="bold" size="8" align="center">
                Judging Queue
              </Text>
            </Flex>
            <Card style={{ flex: 1, overflow: "hidden" }}>
              <Inset>
                <JudgingScheduleTable filteredSchedule={filteredSchedule} getTimeSlotIconButton={getTimeSlotIconButton} />
              </Inset>
            </Card>
          </Flex>
        )}
      </Flex>
    </>
  );
};

export default QueuePage;

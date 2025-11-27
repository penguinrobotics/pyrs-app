import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { usePyrsAppData } from "../../lib/usePyrsAppData";

const KioskPage = () => {
  const [teams, setTeams] = useState([]);
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState("");
  const [judgingSchedule, setJudgingSchedule] = useState(null);

  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected } = usePyrsAppData();

  // Compute queued teams from WebSocket data
  const queued = useMemo(() => {
    return [
      ...nowServing.map((t) => t.number),
      ...queue.map((t) => t.number),
    ];
  }, [nowServing, queue]);

  useEffect(() => {
    const getTeams = async () => {
      const res = await fetch(`/api/teams`);
      const teamsData = await res.json();
      setTeams(teamsData);
    };
    getTeams();
  }, []);

  useEffect(() => {
    const getSchedule = async () => {
      const res = await fetch('/api/judging/schedule');
      const data = await res.json();
      setJudgingSchedule(data);
    };
    getSchedule();
  }, []);

  const handleTeamClick = async (team) => {
    setTeam(team);
    setOpen(true);
  };

  const handleJoin = async () => {
    const res = await fetch(`/api/add`, {
      method: "POST",
      body: JSON.stringify({ team }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.status !== 200) {
      window.alert(`${team} is already in queue`);
    }
  };

  const findJudgingTime = (teamNumber) => {
    if (!judgingSchedule?.schedule) return null;
    const slot = judgingSchedule.schedule.find((s) =>
      s.teams.includes(teamNumber)
    );
    return slot?.time || null;
  };

  const isTimeInFuture = (timeStr) => {
    if (!timeStr) return false;

    // Parse time string (e.g., "1:10 AM")
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return false;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const meridiem = timeMatch[3].toUpperCase();

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const slotTime = hours * 60 + minutes;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return slotTime >= currentTime;
  };

  return (
    <>
      <Head>
        <title>PYRS App - Kiosk</title>
      </Head>
      <Flex direction="column" gap="6">
        <Flex direction="row" align="center" justify="center" gap="4">
          <Text weight="bold" size="9" align="center">
            Join the Queue
          </Text>
          <img src="/assets/catjam.webp" alt="catjam" width={64} height={64} />
        </Flex>
        <Flex direction="row" gap="3" wrap="wrap">
          {teams.map((t, index) => (
            <Button
              key={index}
              size="4"
              style={{ width: "120px", height: "70px" }}
              disabled={queued.includes(t.number)}
              onClick={() => handleTeamClick(t.number)}
            >
              {t.number}
            </Button>
          ))}
        </Flex>
      </Flex>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content width="400px">
          <Flex direction="column" gap="4">
            <Text size="4" p="4">
              Add team <Text weight="bold">{team}</Text> to the queue?
            </Text>
            {(() => {
              const judgingTime = findJudgingTime(team);
              return (
                judgingTime &&
                isTimeInFuture(judgingTime) && (
                  <Text size="3" p="4">
                    Reminder: your judging time is at{" "}
                    <Text weight="bold">{judgingTime}</Text>
                  </Text>
                )
              );
            })()}
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button size="3" onClick={handleJoin}>
                  Join Queue
                </Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default KioskPage;

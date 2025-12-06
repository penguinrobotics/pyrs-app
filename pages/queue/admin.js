import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ReactTimeAgo from "react-time-ago";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Inset,
  Select,
  Slider,
  Spinner,
  Switch,
  Table,
  Text,
} from "@radix-ui/themes";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross2Icon,
  DotsHorizontalIcon,
  GearIcon,
  HomeIcon,
  SpeakerLoudIcon,
} from "@radix-ui/react-icons";
import { usePyrsAppData } from "../../lib/usePyrsAppData";
import { useTTS, announceTeamServed } from "../../lib/useTTS";

const AdminPage = () => {
  const router = useRouter();
  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected } = usePyrsAppData();

  // Initialize TTS
  const tts = useTTS();
  const prevNowServingRef = useRef([]);

  // TTS Settings state
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [ttsRate, setTtsRate] = useState(0.9);
  const [ttsVolume, setTtsVolume] = useState(1.0);

  // Load TTS settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("ttsSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTtsEnabled(settings.enabled ?? true);
        setSelectedVoice(settings.voice ?? "");
        setTtsRate(settings.rate ?? 0.9);
        setTtsVolume(settings.volume ?? 1.0);
      } catch (e) {
        console.error("Failed to load TTS settings:", e);
      }
    }
  }, []);

  // Auto-select Google female voice if no voice is selected
  useEffect(() => {
    if (tts.defaultVoice && !selectedVoice) {
      setSelectedVoice(tts.defaultVoice);
    }
  }, [tts.defaultVoice, selectedVoice]);

  // Save TTS settings to localStorage
  useEffect(() => {
    const settings = {
      enabled: ttsEnabled,
      voice: selectedVoice,
      rate: ttsRate,
      volume: ttsVolume,
    };
    localStorage.setItem("ttsSettings", JSON.stringify(settings));
  }, [ttsEnabled, selectedVoice, ttsRate, ttsVolume]);

  const handleNext = async (field) => {
    await fetch(`/api/serve`, {
      method: "POST",
      body: JSON.stringify({ field }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const handleRemove = async (team) => {
    await fetch(`/api/remove`, {
      method: "POST",
      body: JSON.stringify({ team }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const handleBack = async (team, amount) => {
    await fetch(`/api/unserve`, {
      method: "POST",
      body: JSON.stringify({ team, amount }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  // Announce when a team is served
  useEffect(() => {
    if (!tts.isSupported || !ttsEnabled) return;

    // Find newly added teams
    const prevTeams = prevNowServingRef.current;
    const newlyServed = nowServing.filter(
      (team) => !prevTeams.some((prev) => prev.number === team.number)
    );

    // Announce each newly served team
    newlyServed.forEach((team) => {
      announceTeamServed(team, team.field, tts, {
        voice: selectedVoice,
        rate: ttsRate,
        volume: ttsVolume,
      });
    });

    // Update ref for next comparison
    prevNowServingRef.current = nowServing;
  }, [nowServing, tts, ttsEnabled, selectedVoice, ttsRate, ttsVolume]);

  return (
    <>
      <Head>
        <title>PYRS App - Queue Admin</title>
      </Head>
      <Flex direction="column" gap="5">
        <Flex direction="row" align="center" justify="center" gap="4" position="relative">
          <IconButton
            size="3"
            variant="ghost"
            onClick={() => router.push("/")}
            style={{ position: "absolute", left: 0 }}
          >
            <ChevronLeftIcon />
            <HomeIcon />
          </IconButton>
          <Text weight="bold" size="8" align="center">
            Queue Admin
          </Text>
          <Dialog.Root>
            <Dialog.Trigger>
              <IconButton
                size="3"
                variant="ghost"
                style={{ position: "absolute", right: 0 }}
                title="TTS Settings"
              >
                <GearIcon />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>
                <Flex align="center" gap="2">
                  <SpeakerLoudIcon />
                  Text-to-Speech Settings
                </Flex>
              </Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Configure audio announcements when teams are served
              </Dialog.Description>

              <Flex direction="column" gap="4">
                {/* Enable/Disable TTS */}
                <Flex align="center" justify="between">
                  <Text size="2" weight="medium">
                    Enable announcements
                  </Text>
                  <Switch
                    checked={ttsEnabled}
                    onCheckedChange={setTtsEnabled}
                  />
                </Flex>

                {/* Voice Selection */}
                {tts.voices.length > 0 && (
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Text size="2" weight="medium">
                        Voice
                      </Text>
                      {tts.defaultVoice && selectedVoice === tts.defaultVoice && (
                        <Text size="1" color="green">
                          Google US English ✓
                        </Text>
                      )}
                    </Flex>
                    <Select.Root
                      value={selectedVoice}
                      onValueChange={setSelectedVoice}
                      disabled={!ttsEnabled}
                    >
                      <Select.Trigger placeholder="Select voice..." />
                      <Select.Content>
                        {tts.voices.map((voice) => (
                          <Select.Item key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                            {voice.name === tts.defaultVoice && " [Default]"}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                )}

                {/* Speech Rate */}
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" weight="medium">
                      Speech rate
                    </Text>
                    <Text size="2" color="gray">
                      {ttsRate.toFixed(1)}x
                    </Text>
                  </Flex>
                  <Slider
                    value={[ttsRate]}
                    onValueChange={(values) => setTtsRate(values[0])}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    disabled={!ttsEnabled}
                  />
                </Flex>

                {/* Volume */}
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" weight="medium">
                      Volume
                    </Text>
                    <Text size="2" color="gray">
                      {Math.round(ttsVolume * 100)}%
                    </Text>
                  </Flex>
                  <Slider
                    value={[ttsVolume]}
                    onValueChange={(values) => setTtsVolume(values[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!ttsEnabled}
                  />
                </Flex>

                {/* Test Button */}
                <Button
                  onClick={() => {
                    if (ttsEnabled) {
                      // Test with example: 10012A → "one hundred twelve Alpha"
                      announceTeamServed(
                        { number: "10012A" },
                        1,
                        tts,
                        {
                          voice: selectedVoice,
                          rate: ttsRate,
                          volume: ttsVolume,
                        }
                      );
                    }
                  }}
                  disabled={!ttsEnabled || !tts.isSupported}
                  variant="soft"
                >
                  <SpeakerLoudIcon />
                  Test announcement
                </Button>

                {!tts.isSupported && (
                  <Text size="2" color="red">
                    Text-to-speech is not supported in this browser
                  </Text>
                )}
              </Flex>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Close
                  </Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
        <Grid columns={{ initial: '1', md: '2' }} gap="6" mt="4">
          <Flex gap="4" direction="column">
            <Flex direction="row" align="center" justify="center" gap="2">
              <Text weight="bold" size="7" align="center">
                Send to field
              </Text>
              <img src="/assets/catjump.webp" alt="catjump" width={32} height={32} />
            </Flex>
            <Grid columns="4" gap="2">
              <Button onClick={() => handleNext(1)} size="3" color="red">
                <ChevronLeftIcon />
                1
              </Button>
              <Button onClick={() => handleNext(2)} size="3" color="green">
                <ChevronLeftIcon />
                2
              </Button>
              <Button onClick={() => handleNext(3)} size="3" color="blue">
                <ChevronLeftIcon />
                3
              </Button>
              <Button onClick={() => handleNext(4)} size="3" color="yellow">
                <ChevronLeftIcon />
                4
              </Button>
            </Grid>
            <Card>
              <Inset>
                <Flex
                  direction="column"
                  style={{ backgroundColor: "rgba(0,130,255, 0.1)" }}
                  minHeight="300px"
                >
                  <Table.Root size="1">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Team</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Field</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">
                          Actions
                        </Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {nowServing.map((team, index) => (
                        <Table.Row key={index}>
                          <Table.Cell style={{ verticalAlign: 'middle' }}>
                            <Text size="4" weight="bold">
                              {team.number}
                            </Text>
                          </Table.Cell>
                          <Table.Cell style={{ verticalAlign: 'middle' }}>
                            <Text size="4" weight="bold">
                              {team.field || "-"}
                            </Text>
                          </Table.Cell>
                          <Table.Cell style={{ verticalAlign: 'middle' }}>
                            <Box style={{ fontSize: '16px', fontWeight: 'bold' }}>
                              <ReactTimeAgo
                                date={team.at ? new Date(team.at) : new Date()}
                                locale="en-US"
                                timeStyle="mini"
                              />
                            </Box>
                          </Table.Cell>
                          <Table.Cell>
                            <Flex align="center" justify="center">
                              <Dialog.Root>
                                <Dialog.Trigger>
                                  <IconButton size="1" variant="surface">
                                    <DotsHorizontalIcon />
                                  </IconButton>
                                </Dialog.Trigger>
                                <Dialog.Content style={{ maxWidth: 400 }}>
                                  <Flex direction="row" justify="between" align="top" mb="2">
                                    <Dialog.Title>Team {team.number}</Dialog.Title>
                                    <Dialog.Close>
                                      <IconButton size="1" variant="ghost" color="gray">
                                        <Cross2Icon />
                                      </IconButton>
                                    </Dialog.Close>
                                  </Flex>
                                  <Flex direction="column" gap="3">
                                    <Dialog.Close>
                                      <Button
                                        size="3"
                                        color="crimson"
                                        variant="soft"
                                        onClick={() => handleRemove(team.number)}
                                        style={{ width: '100%' }}
                                      >
                                        <Cross2Icon />
                                        Dequeue team
                                      </Button>
                                    </Dialog.Close>
                                    <Dialog.Close>
                                      <Button
                                        size="3"
                                        variant="soft"
                                        onClick={() => handleBack(team.number)}
                                        style={{ width: '100%' }}
                                      >
                                        <ChevronRightIcon />
                                        Send to top of queue
                                      </Button>
                                    </Dialog.Close>
                                    <Dialog.Close>
                                      <Button
                                        size="3"
                                        variant="soft"
                                        onClick={() => handleBack(team.number, 5)}
                                        style={{ width: '100%' }}
                                      >
                                        <ChevronRightIcon />
                                        Send back 5 spots
                                      </Button>
                                    </Dialog.Close>
                                  </Flex>
                                </Dialog.Content>
                              </Dialog.Root>
                            </Flex>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </Inset>
            </Card>
          </Flex>

          <Flex gap="4" direction="column" width="100%">
            <Flex direction="row" gap="2" align="center" justify="center">
              <Text weight="bold" size="7" align="center">
                Current Queue
              </Text>
              {!isConnected && <Spinner size="3" />}
            </Flex>
            <Card>
              <Inset>
                <Box minHeight="300px" px="4">
                  <ol>
                    <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="2">
                      {queue.map((team, index) => (
                        <li
                          key={index}
                          style={{ listStyle: "decimal", fontSize: "22px" }}
                        >
                          <Grid columns="2">
                            <Text size="7" weight="bold">
                              {team.number}
                            </Text>
                            <IconButton
                              color="crimson"
                              variant="surface"
                              onClick={() => handleRemove(team.number)}
                            >
                              <Cross2Icon />
                            </IconButton>
                          </Grid>
                        </li>
                      ))}
                    </Grid>
                  </ol>
                </Box>
              </Inset>
            </Card>
          </Flex>
        </Grid>
      </Flex>
    </>
  );
};

export default AdminPage;

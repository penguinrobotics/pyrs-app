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
} from "@radix-ui/react-icons";
import { usePyrsAppData } from "../../lib/usePyrsAppData";
import { useTTS, announceTeamServed } from "../../lib/useTTS";

const AdminPage = () => {
  const router = useRouter();
  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected, queueSettings } = usePyrsAppData();

  // Field button colors (cycle through these)
  const fieldColors = ["red", "green", "blue", "yellow", "orange", "purple", "cyan", "pink"];

  // Initialize TTS
  const tts = useTTS();
  const prevNowServingRef = useRef([]);
  const isInitialLoadRef = useRef(true);

  // TTS Settings state
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");
  const ttsRate = 0.9; // Fixed speech rate
  const [ttsVolume, setTtsVolume] = useState(1.0);

  // Queue Settings state
  const [skillsCutoffTime, setSkillsCutoffTime] = useState("2/6 12:00 PM");
  const [skillsTurnoverTime, setSkillsTurnoverTime] = useState(5);
  const [skillsQueueManuallyOpen, setSkillsQueueManuallyOpen] = useState(false);
  const [numberOfFields, setNumberOfFields] = useState(4);
  const [numberOfFieldsInput, setNumberOfFieldsInput] = useState("4");

  // Track if settings have changed
  const settingsChanged = queueSettings && (
    skillsCutoffTime !== (queueSettings.skillsCutoffTime || "2/6 12:00 PM") ||
    skillsTurnoverTime !== (queueSettings.skillsTurnoverTime || 5) ||
    skillsQueueManuallyOpen !== (queueSettings.skillsQueueManuallyOpen || false) ||
    numberOfFields !== (queueSettings.numberOfFields || 4)
  );

  // Load TTS settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("ttsSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTtsEnabled(settings.enabled ?? true);
        setSelectedVoice(settings.voice ?? "");
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
      volume: ttsVolume,
    };
    localStorage.setItem("ttsSettings", JSON.stringify(settings));
  }, [ttsEnabled, selectedVoice, ttsVolume]);

  // Load queue settings from WebSocket
  useEffect(() => {
    if (queueSettings) {
      setSkillsCutoffTime(queueSettings.skillsCutoffTime || "2/6 12:00 PM");
      setSkillsTurnoverTime(queueSettings.skillsTurnoverTime || 5);
      setSkillsQueueManuallyOpen(queueSettings.skillsQueueManuallyOpen || false);
      const fields = queueSettings.numberOfFields || 4;
      setNumberOfFields(fields);
      setNumberOfFieldsInput(String(fields));
    }
  }, [queueSettings]);

  // Save queue settings to server
  const handleSaveSettings = async () => {
    try {
      await fetch('/api/queue/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillsCutoffTime,
          skillsTurnoverTime,
          skillsQueueManuallyOpen,
          numberOfFields
        })
      });
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

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
    // Skip announcements on initial page load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevNowServingRef.current = nowServing;
      return;
    }

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
  }, [nowServing, tts, ttsEnabled, selectedVoice, ttsVolume]);

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
                title="Queue Settings"
              >
                <GearIcon />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>
                <Flex align="center" gap="2">
                  <GearIcon />
                  Queue Settings
                </Flex>
              </Dialog.Title>

              <Flex direction="column" gap="4">
                {/* Number of Fields */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    Number of fields
                  </Text>
                  <input
                    type="number"
                    value={numberOfFieldsInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNumberOfFieldsInput(value);
                      if (value !== '') {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 1 && numValue <= 8) {
                          setNumberOfFields(numValue);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value === '' || isNaN(parseInt(value))) {
                        setNumberOfFieldsInput(String(numberOfFields));
                      } else {
                        const numValue = Math.max(1, Math.min(8, parseInt(value)));
                        setNumberOfFields(numValue);
                        setNumberOfFieldsInput(String(numValue));
                      }
                    }}
                    min={1}
                    max={8}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px'
                    }}
                  />
                  <Text size="1" color="gray">
                    Number of fields available for serving teams
                  </Text>
                </Flex>

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

                {/* Skills Queue Cutoff Time */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    Skills queue cutoff date/time
                  </Text>
                  <input
                    type="text"
                    value={skillsCutoffTime}
                    onChange={(e) => setSkillsCutoffTime(e.target.value)}
                    placeholder="2/6 12:00 PM"
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-6)',
                      fontSize: '14px'
                    }}
                  />
                  <Text size="1" color="gray">
                    Format: MM/dd hh:mm AM/PM (e.g., 2/6 12:00 PM)
                  </Text>
                </Flex>

                {/* Skills Turnover Time */}
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" weight="medium">
                      Average time per team
                    </Text>
                    <Text size="2" color="gray">
                      {skillsTurnoverTime} min
                    </Text>
                  </Flex>
                  <Slider
                    value={[skillsTurnoverTime]}
                    onValueChange={(values) => setSkillsTurnoverTime(values[0])}
                    min={1}
                    max={15}
                    step={1}
                  />
                  <Text size="1" color="gray">
                    Used to calculate queue capacity
                  </Text>
                </Flex>

                {/* Manual Override */}
                <Flex align="center" justify="between">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Manually re-open queue
                    </Text>
                    <Text size="1" color="gray">
                      Overrides automatic cutoff
                    </Text>
                  </Flex>
                  <Switch
                    checked={skillsQueueManuallyOpen}
                    onCheckedChange={setSkillsQueueManuallyOpen}
                  />
                </Flex>

                {!tts.isSupported && (
                  <Text size="2" color="red">
                    Text-to-speech is not supported in this browser
                  </Text>
                )}
              </Flex>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!settingsChanged}
                  >
                    Save
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
            <Grid columns={numberOfFields.toString()} gap="2">
              {Array.from({ length: numberOfFields }, (_, i) => i + 1).map((fieldNum) => (
                <Button
                  key={fieldNum}
                  onClick={() => handleNext(fieldNum)}
                  size="3"
                  color={fieldColors[(fieldNum - 1) % fieldColors.length]}
                >
                  <ChevronLeftIcon />
                  {fieldNum}
                </Button>
              ))}
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

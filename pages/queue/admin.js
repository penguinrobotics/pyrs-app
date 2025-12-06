import React, { useEffect } from "react";
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
  Spinner,
  Table,
  Text,
} from "@radix-ui/themes";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross2Icon,
  DotsHorizontalIcon,
  HomeIcon,
} from "@radix-ui/react-icons";
import { usePyrsAppData } from "../../lib/usePyrsAppData";

const AdminPage = () => {
  const router = useRouter();
  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected } = usePyrsAppData();

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

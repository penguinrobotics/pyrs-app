import React, { useEffect } from "react";
import Head from "next/head";
import ReactTimeAgo from "react-time-ago";
import {
  Box,
  Button,
  Card,
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
} from "@radix-ui/react-icons";
import { usePyrsAppData } from "../../lib/usePyrsAppData";

const AdminPage = () => {
  // Get real-time queue data from WebSocket
  const { nowServing, queue, isConnected } = usePyrsAppData();

  const handleNext = async () => {
    await fetch(`/api/serve`, { method: "POST" });
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Backspace") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <Head>
        <title>PYRS App - Admin</title>
      </Head>
      <Flex direction="column" gap="6">
        <Flex direction="row" align="center" justify="center" gap="4">
          <Text weight="bold" size="8" align="center">
            Admin Page
          </Text>
          <img src="/assets/donut.png" alt="chipi" width={64} height={64} />
        </Flex>
        <Grid columns={{ initial: '1', md: '2' }} gap="6" mt="4">
          <Flex gap="4" direction="column">
            <Flex direction="row" align="center" justify="center" gap="2">
              <Text weight="bold" size="7" align="center">
                Up Next
              </Text>
              <img src="/assets/catjump.webp" alt="catjump" width={32} height={32} />
            </Flex>
            <Button onClick={handleNext} size="4">
              <ChevronLeftIcon />
              Queue next team
            </Button>
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
                        <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">
                          Remove
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">
                          Move back
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
                            <Box style={{ fontSize: '16px', fontWeight: 'bold' }}>
                              <ReactTimeAgo
                                date={team.at ? new Date(team.at) : new Date()}
                                locale="en-US"
                                timeStyle="mini"
                              />
                            </Box>
                          </Table.Cell>
                          <Table.Cell>
                            <Flex justify="center">
                              <IconButton
                                color="crimson"
                                variant="surface"
                                onClick={() => handleRemove(team.number)}
                              >
                                <Cross2Icon />
                              </IconButton>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell>
                            <Flex direction="row" gap="2" justify="center">
                              <Button
                                onClick={() => handleBack(team.number)}
                                variant="surface"
                              >
                                <ChevronRightIcon />
                              </Button>
                              <Button
                                onClick={() => handleBack(team.number, 5)}
                                variant="surface"
                              >
                                <ChevronRightIcon />
                                5x
                              </Button>
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

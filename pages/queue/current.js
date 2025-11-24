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

  return (
    <>
      <Head>
        <title>PYRS App - Queue</title>
      </Head>
      <Flex direction="column" gap="6">
        <Flex direction="row" align="center" justify="center" gap="4">
          <Text weight="bold" size="9" align="center">
            Skills Queue
          </Text>
          <img src="/assets/chipi.webp" alt="chipi" width={64} height={64} />
        </Flex>
        <Callout.Root size="3" style={{ justifyContent: "center" }}>
          <Callout.Text>
            <Text size="6" align="center">
              Come to the queueing desk when your team is displayed in the Up Next
              box
            </Text>
          </Callout.Text>
        </Callout.Root>
        <Flex direction="row" gap="6" mt="4">
          <Flex width="600px" gap="4" direction="column">
            <Flex direction="row" align="center" justify="center" gap="2">
              <Text weight="bold" size="7" align="center">
                Up Next
              </Text>
              <img src="/assets/catjump.webp" alt="catjump" width={32} height={32} />
            </Flex>
            <Card style={{ backgroundColor: "rgba(0,130,255,1)" }}>
              <Inset>
                <Flex
                  p="4"
                  direction="column"
                  gap="2"
                  style={{
                    backgroundColor: flash ? "transparent" : "rgb(0,130,255)",
                  }}
                  minHeight="300px"
                >
                  <Table.Root size="1" variant="ghost" style={{ color: "white" }}>
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
                    <Table.Body>
                      {nowServing.map((team, index) => (
                        <Table.Row key={index}>
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
                </Flex>
              </Inset>
            </Card>
          </Flex>

          <Flex gap="4" direction="column" width="100%">
            <Flex direction="row" gap="2" align="center" justify="center">
              <Text weight="bold" size="7" align="center">
                Current Queue
              </Text>
              <Spinner size="3" />
            </Flex>
            <Card>
              <Inset>
                <Callout.Root
                  size="1"
                  variant="surface"
                  style={{ justifyContent: "center" }}
                >
                  <Flex direction="row" align="center" justify="center">
                    <Text size="4" align="center">
                      Join the queue on the kiosk tablet
                    </Text>
                    <img src="/assets/penguin.webp" alt="penguin" width={32} height={32} />
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
    </>
  );
};

export default QueuePage;

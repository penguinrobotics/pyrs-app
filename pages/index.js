import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Button, Flex, Text } from "@radix-ui/themes";

const HomePage = () => {
  return (
    <>
      <Head>
        <title>PYRS App</title>
      </Head>
      <Flex direction="column" gap="6" align="center" justify="center" style={{ minHeight: "80vh" }}>
        <Text weight="bold" size="9" align="center">
          PYRS App
        </Text>
        <Flex direction="column" gap="4" style={{ width: "100%", maxWidth: "400px" }}>
          <Link href="/referee" style={{ width: "100%" }}>
            <Button size="3" style={{ width: "100%", height: "80px" }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold">🏁 Referee</Text>
                <Text size="1" style={{ opacity: 0.8 }}>Track on-field violations</Text>
              </Flex>
            </Button>
          </Link>
          <Link href="/queue/admin" style={{ width: "100%" }}>
            <Button size="3" style={{ width: "100%", height: "80px" }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold">⚙️ Queue Admin</Text>
                <Text size="1" style={{ opacity: 0.8 }}>Manage skills queue</Text>
              </Flex>
            </Button>
          </Link>
          <Link href="/queue/kiosk" style={{ width: "100%" }}>
            <Button size="3" variant="surface" style={{ width: "100%", height: "60px" }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold">🎫 Kiosk</Text>
                <Text size="1" style={{ opacity: 0.8 }}>Skills registration view</Text>
              </Flex>
            </Button>
          </Link>
          <Link href="/queue/current" style={{ width: "100%" }}>
            <Button size="3" variant="surface" style={{ width: "100%", height: "60px" }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold">📺 Current Queue</Text>
                <Text size="1" style={{ opacity: 0.8 }}>Pit display view of queue</Text>
              </Flex>
            </Button>
          </Link>
        </Flex>
        <Text size="2" style={{ opacity: 0.6, marginTop: "2rem" }}>
          💜 made w/ love by @kevqiu
        </Text>
      </Flex>
    </>
  );
};

export default HomePage;


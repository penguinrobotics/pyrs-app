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
            <Button size="4" style={{ width: "100%", height: "70px" }}>
              Referee Page
            </Button>
          </Link>
          <Link href="/queue/admin" style={{ width: "100%" }}>
            <Button size="4" style={{ width: "100%", height: "70px" }}>
              Queue Admin Page
            </Button>
          </Link>
          <Link href="/queue/kiosk" style={{ width: "100%" }}>
            <Button size="4" style={{ width: "100%", height: "70px" }}>
              Kiosk
            </Button>
          </Link>
          <Link href="/queue/current" style={{ width: "100%" }}>
            <Button size="4" style={{ width: "100%", height: "70px" }}>
              Current Queue
            </Button>
          </Link>
        </Flex>
      </Flex>
    </>
  );
};

export default HomePage;


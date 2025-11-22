import React, { useEffect, useState } from "react";
import Head from "next/head";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Inset,
  Select,
  Table,
  Text,
} from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useQueueData } from "../lib/useQueueData";

const RULES = [
  { ruleId: "S1" },
  { ruleId: "S2" },
  { ruleId: "S3" },
  { ruleId: "S4" },
  { ruleId: "G1" },
  { ruleId: "G2" },
  { ruleId: "G3" },
  { ruleId: "G4" },
  { ruleId: "G5" },
  { ruleId: "G6" },
  { ruleId: "G7" },
  { ruleId: "G8" },
  { ruleId: "G9" },
  { ruleId: "G10" },
  { ruleId: "G11" },
  { ruleId: "G12" },
  { ruleId: "G13" },
  { ruleId: "G14" },
  { ruleId: "G15" },
  { ruleId: "G16" },
  { ruleId: "G17" },
  { ruleId: "SG1" },
  { ruleId: "SG2" },
  { ruleId: "SG3" },
  { ruleId: "SG4" },
  { ruleId: "SG5" },
  { ruleId: "SG6" },
  { ruleId: "SG7" },
  { ruleId: "SG8" },
  { ruleId: "SG9" },
  { ruleId: "SG10" },
  { ruleId: "SG11" },
  { ruleId: "T6" }
];

const RefereePage = () => {
  const [teams, setTeams] = useState([]);
  const { violations } = useQueueData();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeViolationData, setRemoveViolationData] = useState(null);

  const [formData, setFormData] = useState({
    team: "",
    rule: "",
    sev: "Minor",
    index: "All",
  });

  useEffect(() => {
    const getTeams = async () => {
      const res = await fetch(`/api/teams`);
      const teamsData = await res.json();
      setTeams(teamsData);
    };
    getTeams();
  }, []);

  // when the submit button is pressed
  const onSubmit = async (e) => {
    e.preventDefault();
    // check for three minor violations
    //for loop to count all violations that match the form data
    const i = violations.filter(
      (t) =>
        t.number === formData.team &&
        t.ruleId === formData.rule &&
        t.severity === formData.sev
    );
    // Open dialog for confirmation
    setAddDialogOpen(true);
  };

  const handleAddViolation = async () => {
    const i = violations.filter(
      (t) =>
        t.number === formData.team &&
        t.ruleId === formData.rule &&
        t.severity === formData.sev
    );
    // create output object
    const out = {
      team: formData.team,
      rule: formData.rule,
      severity: formData.sev,
    };
    console.log(out);
    // send data to the server
    const res = await fetch(`/api/add_violation`, {
      method: "POST",
      body: JSON.stringify(out),
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Reset form after submission
    setFormData({
      team: "",
      rule: "",
      sev: "Minor",
      index: formData.index,
    });
    setAddDialogOpen(false);
  };

  const displayTable = (e) => {
    setFormData({ ...formData, index: e.target.value });
  };

  const handleRemoveClick = (team, rule, severity) => {
    setRemoveViolationData({ team, rule, severity });
    setRemoveDialogOpen(true);
  };

  const handleRemoveViolation = async () => {
    const { team, rule, severity } = removeViolationData;
    // create output object
    const out = {
      team: team,
      rule: rule,
      severity: severity,
    };
    const res = await fetch(`/api/remove_violation`, {
      method: "POST",
      body: JSON.stringify(out),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setRemoveDialogOpen(false);
    setRemoveViolationData(null);
  };

  const badTeams = new Set(violations.map(violation => violation.number));

  return (
    <>
      <Head>
        <title>PYRS App - Referee</title>
      </Head>
      <Flex direction="column" gap="6">
        <Flex direction="row" align="center" justify="center" gap="4">
          <Text weight="bold" size="8" align="center">
            Referee Page
          </Text>
        </Flex>
        <Card>
          <Inset>
            <Flex direction="column" gap="4" p="4">
              <form onSubmit={onSubmit}>
                <Flex direction="column" gap="4">
                  <Text weight="bold" size="6" color="red">
                    Add Violation
                  </Text>
                  <Select.Root
                    value={formData.team}
                    onValueChange={(value) =>
                      setFormData({ ...formData, team: value })
                    }
                  >
                    <Select.Trigger placeholder="Team" />
                    <Select.Content>
                      {teams.map((team) => (
                        <Select.Item key={team.number} value={team.number}>
                          {team.number}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                  <Flex direction="row" gap="4">
                    <Select.Root
                      value={formData.rule}
                      onValueChange={(value) =>
                        setFormData({ ...formData, rule: value })
                      }
                    >
                      <Select.Trigger placeholder="Rule" style={{ flexGrow: 1 }} />
                      <Select.Content>
                        {RULES.map((rule) => (
                          <Select.Item key={rule.ruleId} value={rule.ruleId}>
                            {rule.ruleId}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <Select.Root
                      value={formData.sev}
                      onValueChange={(value) =>
                        setFormData({ ...formData, sev: value })
                      }
                    >
                      <Select.Trigger placeholder="Severity" style={{ flexGrow: 1 }} />
                      <Select.Content>
                        <Select.Item value="Minor">Minor</Select.Item>
                        <Select.Item value="Major">Major</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                  <Button
                    type="submit"
                    color="red"
                    variant="outline"
                    disabled={
                      formData.team === "" ||
                      formData.rule === "" ||
                      formData.sev === ""
                    }
                    style={{ width: "100%" }}
                  >
                    Add violation
                  </Button>
                </Flex>
              </form>
            </Flex>
          </Inset>
        </Card>
        <Card>
          <Inset>
            <Flex direction="column" gap="4" p="4">
              <Text weight="bold" size="6" color="red">
                View Violations
              </Text>
              <Select.Root
                value={formData.index}
                onValueChange={(value) => displayTable({ target: { value } })}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="All">All</Select.Item>
                  {[...badTeams].map((teamNumber) => (
                    <Select.Item key={teamNumber} value={teamNumber}>
                      {teamNumber}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Team</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Rule</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Remove</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {formData.index === "All"
                    ? violations.map((team, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>
                          <Text weight="bold">{team.number}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text weight="bold">{team.ruleId}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            weight="bold"
                            style={{
                              color:
                                team.severity === "Major"
                                  ? "#de6057"
                                  : "#ebb31a",
                            }}
                          >
                            {team.severity}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            color="red"
                            variant="outline"
                            size="1"
                            onClick={() =>
                              handleRemoveClick(
                                team.number,
                                team.ruleId,
                                team.severity
                              )
                            }
                          >
                            <Cross2Icon />
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                    : violations
                      .filter((t) => t.number === formData.index)
                      .map((team, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>
                            <Text weight="bold">{team.number}</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text weight="bold">{team.ruleId}</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text
                              weight="bold"
                              style={{
                                color:
                                  team.severity === "Major"
                                    ? "#de6057"
                                    : "#ebb31a",
                              }}
                            >
                              {team.severity}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Button
                              color="red"
                              variant="outline"
                              size="1"
                              onClick={() =>
                                RemoveViolation(
                                  team.number,
                                  team.ruleId,
                                  team.severity
                                )
                              }
                            >
                              <Cross2Icon />
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Inset>
        </Card>
      </Flex>
      <Dialog.Root open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <Dialog.Content>
          <Flex direction="column" gap="4">
            <Text size="4" p="4">
              Add {formData.sev} {formData.rule} violation for{" "}
              <Text weight="bold">{formData.team}</Text>?
              <br />
              <Text size="2">
                {formData.team} has{" "}
                {violations.filter(
                  (t) =>
                    t.number === formData.team &&
                    t.ruleId === formData.rule &&
                    t.severity === formData.sev
                ).length}{" "}
                total violations of this type
              </Text>
            </Text>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button size="3" color="red" onClick={handleAddViolation}>
                  Add violation
                </Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <Dialog.Content width="400px">
          <Flex direction="column" gap="4">
            <Text size="4" p="4">
              Remove {removeViolationData?.severity} {removeViolationData?.rule}{" "}
              violation for <Text weight="bold">{removeViolationData?.team}</Text>?
              <br />
              <Text size="2">
                {removeViolationData?.team} has{" "}
                {removeViolationData
                  ? violations.filter(
                    (t) =>
                      t.number === removeViolationData.team &&
                      t.ruleId === removeViolationData.rule &&
                      t.severity === removeViolationData.severity
                  ).length
                  : 0}{" "}
                total violations of this type
              </Text>
            </Text>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  onClick={() => setRemoveDialogOpen(false)}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button size="3" color="red" onClick={handleRemoveViolation}>
                  Remove violation
                </Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default RefereePage;


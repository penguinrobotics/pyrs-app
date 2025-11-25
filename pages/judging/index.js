import { useEffect, useState, useRef, useMemo } from 'react';
import { Button, Card, Flex, Text, TextField, Table, Dialog, Callout, Spinner } from '@radix-ui/themes';
import { useReactToPrint } from 'react-to-print';

export default function JudgingPage() {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    startTime: '9:30 AM',
    panels: 3,
    interval: 15
  });
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        const data = await res.json();
        setTeams(data);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, []);

  // Fetch existing schedule on mount
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch('/api/judging/schedule');
        const data = await res.json();
        if (data.schedule && data.schedule.length > 0) {
          setSchedule(data);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  // Client-side preview algorithm
  const preview = useMemo(() => {
    if (!teams.length || !formData.panels || !formData.interval) {
      return null;
    }

    const totalSlots = Math.ceil(teams.length / formData.panels);

    // Calculate end time
    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const formatTime = (hours, minutes) => {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const time = parseTime(formData.startTime);
    if (!time) return null;

    const totalMinutes = time.hours * 60 + time.minutes + ((totalSlots - 1) * formData.interval);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const endTime = formatTime(endHours, endMinutes);

    // Quick collision estimate
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    let collisions = 0;
    for (let i = 0; i < shuffled.length; i += formData.panels) {
      const slot = shuffled.slice(i, i + formData.panels);
      const orgs = slot.map(t => t.organization);
      const unique = new Set(orgs);
      collisions += (orgs.length - unique.size);
    }

    return {
      endTime,
      totalSlots,
      estimatedCollisions: collisions
    };
  }, [teams, formData.startTime, formData.panels, formData.interval]);

  const handleGenerate = async () => {
    // Check if schedule exists
    if (schedule && schedule.schedule && schedule.schedule.length > 0) {
      setConfirmDialogOpen(true);
      return;
    }

    await generateSchedule();
  };

  const generateSchedule = async () => {
    setLoading(true);
    setConfirmDialogOpen(false);

    try {
      const res = await fetch('/api/judging/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: formData.startTime,
          panels: parseInt(formData.panels),
          interval: parseInt(formData.interval),
          teams
        })
      });

      const data = await res.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="row" align="center" justify="center" gap="4">
          <Text weight="bold" size="8" align="center">
            Judging Schedule Generator
          </Text>
        </Flex>

        {/* Form Card */}
        <Card>
          <Flex direction="column" gap="4">
            <Text size="5" weight="bold">Schedule Parameters</Text>

            <Flex gap="4" wrap="wrap">
              <Flex direction="column" gap="2" style={{ flex: '1', minWidth: '200px' }}>
                <Text size="2" weight="bold">Start Time</Text>
                <TextField.Root
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  placeholder="9:30 AM"
                />
              </Flex>

              <Flex direction="column" gap="2" style={{ flex: '1', minWidth: '200px' }}>
                <Text size="2" weight="bold">Number of Judging Panels</Text>
                <TextField.Root
                  type="number"
                  value={formData.panels}
                  onChange={(e) => setFormData({ ...formData, panels: e.target.value })}
                  min="1"
                />
              </Flex>

              <Flex direction="column" gap="2" style={{ flex: '1', minWidth: '200px' }}>
                <Text size="2" weight="bold">Interval (minutes)</Text>
                <TextField.Root
                  type="number"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  min="1"
                />
              </Flex>

              <Flex direction="column" gap="2" style={{ flex: '1', minWidth: '200px' }}>
                <Text size="2" weight="bold">Number of Teams</Text>
                <TextField.Root
                  type="number"
                  value={teams.length}
                  disabled
                />
              </Flex>
            </Flex>

            {/* Preview */}
            {preview && (
              <Callout.Root color="blue">
                <Callout.Text>
                  <Flex direction="column" gap="1">
                    <Text><strong>Preview:</strong></Text>
                    <Text>Total time slots: {preview.totalSlots}</Text>
                    <Text>Estimated end time: {preview.endTime}</Text>
                    <Text>Estimated organization collisions: {preview.estimatedCollisions}</Text>
                  </Flex>
                </Callout.Text>
              </Callout.Root>
            )}

            <Button
              size="3"
              onClick={handleGenerate}
              disabled={!teams.length || loading}
            >
              {loading ? <Spinner /> : 'Generate Schedule'}
            </Button>
          </Flex>
        </Card>

        {/* Schedule Display */}
        {schedule && schedule.schedule && schedule.schedule.length > 0 && (
          <Card>
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Text size="5" weight="bold">Generated Schedule</Text>
                <Button onClick={handlePrint}>
                  🖨️ Print Schedule
                </Button>
              </Flex>

              {schedule.metadata && (
                <Callout.Root color="green">
                  <Callout.Text>
                    <Flex direction="column" gap="1">
                      <Text><strong>Schedule Information:</strong></Text>
                      <Text>Generated at: {new Date(schedule.metadata.generatedAt).toLocaleString()}</Text>
                      <Text>Organization collisions: {schedule.metadata.collisions}</Text>
                    </Flex>
                  </Callout.Text>
                </Callout.Root>
              )}

              <div ref={printRef}>
                <style jsx global>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #print-area, #print-area * {
                      visibility: visible;
                    }
                    #print-area {
                    }
                  }
                  #print-area td, #print-area th {
                    padding: 12px !important;
                  }
                `}</style>
                <div id="print-area">
                  <Text size="8" align="center" style={{ display: 'block', marginBottom: '24px', fontSize: '40px', fontWeight: 700 }}>
                    Judging Schedule
                  </Text>
                  <Table.Root variant="surface">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                        {schedule.metadata && Array.from({ length: schedule.metadata.panels }).map((_, i) => (
                          <Table.ColumnHeaderCell key={i}></Table.ColumnHeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {schedule.schedule.map((slot, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>
                            <Text weight="bold" style={{ fontWeight: 700 }}>{slot.time}</Text>
                          </Table.Cell>
                          {slot.teams.map((team, teamIndex) => (
                            <Table.Cell key={teamIndex}>
                              <Text>{team}</Text>
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </div>
              </div>
            </Flex>
          </Card>
        )}
      </Flex>

      {/* Confirmation Dialog */}
      <Dialog.Root open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <Dialog.Content>
          <Dialog.Title>Replace Existing Schedule?</Dialog.Title>
          <Dialog.Description>
            A schedule already exists. Are you sure you want to generate a new one? This will replace the current schedule.
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">Cancel</Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button onClick={generateSchedule}>Generate New Schedule</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

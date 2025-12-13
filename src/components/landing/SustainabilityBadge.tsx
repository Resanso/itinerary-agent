import { Card, Container } from '@/components/ui';

export default function SustainabilityBadge() {
  return (
    <section className="py-8" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <Container maxWidth="xl" padding="md">
        <Card
          variant="default"
          padding="md"
          className="text-center"
          style={{ 
            backgroundColor: 'var(--color-accent-success)',
            border: '1px solid rgba(66, 194, 150, 0.2)'
          }}
        >
          <p className="font-medium" style={{ color: 'var(--color-status-green-text)' }}>
            Supporting SDG 8 & 11
          </p>
        </Card>
      </Container>
    </section>
  );
}


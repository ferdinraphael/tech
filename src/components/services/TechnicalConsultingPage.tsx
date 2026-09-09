import { ServiceDetailLayout, ServiceSection } from './ServiceDetailLayout'
import styles from './Services.module.css'

export function TechnicalConsultingPage() {
  return (
    <ServiceDetailLayout
      eyebrow="TECHNICAL CONSULTING"
      title="Understand the problem before committing to the solution."
      intro={<>
        <p>For founders, product teams, engineering teams, and businesses that need an experienced outside view of an important technical decision or system.</p>
        <p>I can help you work out what is causing a problem, compare the options, and decide what to do next.</p>
      </>}
      remote="Remote engagements only."
      action="Start with the question"
      closingTitle="Have a technical decision you need to work through?"
      closingCopy="Start with the problem, the system involved, and what feels uncertain."
      closingAction="Discuss the situation"
    >
      <ServiceSection id="three-ways-i-can-help" title="Three ways I can help">
        <div className={styles.offer}>
          <h3>Technical review &amp; assessment</h3>
          <p>If an existing system has become difficult to change, scale, deploy, or reason about, I can review the relevant architecture, code, infrastructure, or integrations and help identify what is actually causing the problem and what should be addressed first.</p>
          <p>That might mean tracing a slow request, checking a fragile deployment, or finding where changes keep breaking other parts of the system.</p>
          <p className={styles.pricing}><strong>Pricing:</strong> Hourly for focused reviews or fixed-scope for larger assessments.</p>
        </div>
        <div className={styles.offer}>
          <h3>Modernization &amp; adoption planning</h3>
          <p>Planning a modernization, cloud move, scalability change, or AI adoption? I can help examine the current constraints, compare realistic options, and work out a practical sequence rather than jumping straight to a technology choice.</p>
          <p>The plan can account for dependencies in the existing system, risks, and what to test before committing to a wider change.</p>
          <p>For AI work, we start by asking whether it solves a real problem at all.</p>
          <p className={styles.pricing}><strong>Pricing:</strong> Usually a fixed-scope assessment or roadmap engagement.</p>
        </div>
        <div className={styles.offer}>
          <h3>Ongoing technical advisory</h3>
          <p>If difficult technical decisions keep coming up, I can stay involved on a recurring basis for architecture reviews, technical planning, trade-off discussions, and design decisions.</p>
          <p>That can include reviewing proposed solutions, prioritizing technical debt, or working through reliability and integration concerns.</p>
          <p className={styles.pricing}><strong>Engagement:</strong> Usually reserved monthly advisory time.</p>
        </div>
      </ServiceSection>
      <ServiceSection id="how-a-consulting-engagement-usually-works" title="How a consulting engagement usually works">
        <div className={styles.subsection}>
          <h3>1. Start with the problem</h3>
          <p>Tell me what is unclear, risky, difficult, or changing.</p>
        </div>
        <div className={styles.subsection}>
          <h3>2. Review the relevant context</h3>
          <p>I look at the parts of the system needed to understand the issue.</p>
        </div>
        <div className={styles.subsection}>
          <h3>3. Work through the options</h3>
          <p>We compare realistic approaches, trade-offs, and risks.</p>
        </div>
        <div className={styles.subsection}>
          <h3>4. Leave with practical next steps</h3>
          <p>You get a recommendation, assessment, roadmap, or another agreed output.</p>
        </div>
      </ServiceSection>
      <ServiceSection id="relevant-experience" title="Relevant experience">
        <p>My experience includes:</p>
        <ul>
          <li>architecture and implementation decisions in enterprise applications;</li>
          <li>integrations and deployment constraints;</li>
          <li>application modernization;</li>
          <li>Azure/cloud and delivery decisions;</li>
          <li>maintainability and technical debt;</li>
          <li>evaluating where newer approaches, including AI-assisted capabilities, are useful.</li>
        </ul>
      </ServiceSection>
    </ServiceDetailLayout>
  )
}

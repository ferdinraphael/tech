import { ServiceDetailLayout, ServiceSection } from './ServiceDetailLayout'
import styles from './Services.module.css'

export function MentoringTeachingPage() {
  return (
    <ServiceDetailLayout
      eyebrow="MENTORING &amp; TEACHING"
      title="Learn by understanding the problem and doing the work."
      intro={<>
        <p>Practical 1-on-1 learning, developer mentoring, and small-group training that starts from what you already know.</p>
      </>}
      remote="All sessions are remote."
      action="Discuss what you want to learn"
      closingTitle="Want to learn something specific?"
      closingCopy="Tell me what you already know, what you want to learn, and what you want to be able to do with it."
      closingAction="Discuss your learning goal"
    >
      <ServiceSection id="three-ways-to-learn" title="Three ways to learn">
        <div className={styles.offer}>
          <h3>1-on-1 learning &amp; tutoring</h3>
          <p>We start with what you already know and what you want to learn, then build a flexible path around that. Sessions can combine explanation, live coding, exercises, debugging, assignments, and projects.</p>
          <p className={styles.pricing}><strong>Pricing:</strong> <span className={styles.rate}>₹1,500/hour</span>.</p>
          <p>Reduced rates are available for recurring monthly plans paid in advance.</p>
          <p>One-off focused sessions are available for a specific concept, bug, assignment, or technical problem.</p>
        </div>
        <div className={styles.offer}>
          <h3>Developer mentoring &amp; problem-solving</h3>
          <p>Bring a bug, pull request, design question, side project, architecture question, unfamiliar codebase, or difficult technical decision.</p>
          <p>We can use that work to improve how you:</p>
          <ul>
            <li>debug;</li>
            <li>review code;</li>
            <li>reason about design and architecture;</li>
            <li>work with APIs and integrations;</li>
            <li>decide on a testing strategy;</li>
            <li>refactor;</li>
            <li>work with CI/CD and deployment;</li>
            <li>understand unfamiliar systems.</li>
          </ul>
          <p className={styles.pricing}><strong>Pricing:</strong> <span className={styles.rate}>₹1,500/hour</span>.</p>
        </div>
        <div className={styles.offer}>
          <h3>Team or small-group training</h3>
          <p>Focused remote training for a small group around a defined technical goal.</p>
          <p>Training is built around what participants already know and what they need to be able to do afterward.</p>
          <p>Possible topics include:</p>
          <ul>
            <li>Python for Java/C# developers;</li>
            <li>pytest and API automation;</li>
            <li>Playwright;</li>
            <li>debugging and problem solving;</li>
            <li>async/await in C#;</li>
            <li>AI/LLM foundations for developers.</li>
          </ul>
          <p className={styles.pricing}><strong>Pricing:</strong> Quoted per workshop or short series based on scope, preparation, and customization.</p>
        </div>
      </ServiceSection>
      <ServiceSection id="areas-i-teach" title="Areas I teach">
        <div className={styles.subsection}>
          <h3>Python &amp; programming</h3>
          <p>Python fundamentals, APIs, testing, automation, packages, environments, debugging, and application development.</p>
        </div>
        <div className={styles.subsection}>
          <h3>C# &amp; .NET</h3>
          <p>C# fundamentals, OOP, async/await, debugging, APIs, testing, and .NET application development.</p>
        </div>
        <div className={styles.subsection}>
          <h3>Software engineering &amp; problem solving</h3>
          <p>Debugging, data structures and algorithms, code design, testing, Git, APIs, and unfamiliar technical problems.</p>
        </div>
        <div className={styles.subsection}>
          <h3>Test automation</h3>
          <p>pytest, API automation, Playwright, automation design, and CI/CD fundamentals.</p>
        </div>
        <div className={styles.subsection}>
          <h3>AI &amp; LLM foundations</h3>
          <p>AI concepts, search and reasoning, LLM APIs, application patterns, and practical projects.</p>
        </div>
      </ServiceSection>
      <ServiceSection id="already-know-another-language" title="Already know another language?">
        <p>If you already know Java or C# and want to learn Python, we do not need to start again from “what is a variable?”</p>
        <p>We can focus on what is actually different: the language, conventions, tools, and ways of thinking that change with the ecosystem.</p>
      </ServiceSection>
    </ServiceDetailLayout>
  )
}

import { useState } from 'react';
import './HowItWorks.css';

function HowItWorks() {
  return (
    <div className="how-it-works-container">
      <h2>L1Beat Scoring Algorithm </h2>
      
      <div className="scoring-section">
        <h3>Scoring Criteria</h3>
        <div className="criteria-grid">
          <div className="criteria-item">
            <h4>Decentralization (30%)</h4>
            <ul>
              <li>Number of validators</li>
              <li>Stake distribution</li>
              <li>Geographic distribution</li>
            </ul>
          </div>

          <div className="criteria-item">
            <h4>Security (25%)</h4>
            <ul>
              <li>Network uptime</li>
              <li>Attack resistance</li>
              <li>Code audit status</li>
            </ul>
          </div>

          <div className="criteria-item">
            <h4>Performance (25%)</h4>
            <ul>
              <li>Transaction speed (TPS)</li>
              <li>Block finality time</li>
              <li>Network latency</li>
            </ul>
          </div>

          <div className="criteria-item">
            <h4>Ecosystem (20%)</h4>
            <ul>
              <li>Developer activity</li>
              <li>Community size</li>
              <li>Total Value Locked (TVL)</li>
            </ul>
          </div>
        </div>

        <div className="score-ranges">
          <h3>Score Ranges</h3>
          <div className="range-item">
            <span className="score-badge high">80-100</span>
            <p>Excellent - High performance and security standards</p>
          </div>
          <div className="range-item">
            <span className="score-badge medium">50-79</span>
            <p>Good - Meets basic requirements with room for improvement</p>
          </div>
          <div className="range-item">
            <span className="score-badge low">0-49</span>
            <p>Needs Improvement - Significant concerns in multiple areas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;

import "./tabs.css";
import { useState } from "react";

export interface TabsProps {
  tabs: {
    label: string;
    content: JSX.Element;
  }[];
}

function Tabs({ tabs }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].label);

  return (
    <div className="tabs">
      <ul className="nav">
        {tabs.map(({ label }) => {
          return (
            <li
              key={label}
              className={activeTab === label ? "active" : ""}
              onClick={() => setActiveTab(label)}
            >
              {label}
            </li>
          );
        })}
      </ul>
      <div className="tab-content">
        {tabs.find(({ label }) => label === activeTab)?.content}
      </div>
    </div>
  )
}

export default Tabs;

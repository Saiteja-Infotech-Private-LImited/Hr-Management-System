'use client';
import { Plus, Minus } from 'lucide-react';

export default function OrgChartPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-2">
      <div className="mb-8">
        <h1 className="text-[24px] font-extrabold text-slate-900 dark:text-white">ORG Chart</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 min-h-[600px] flex justify-center overflow-x-auto border border-slate-100 dark:border-slate-700/50">
        
        {/* Tree Container */}
        <div className="org-tree">
          <ul>
            <li>
              {/* Root Node */}
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-8 py-3 text-[14px] font-bold text-slate-900 dark:text-white shadow-sm z-10 relative bg-clip-padding">
                  Unpixel Office
                </div>
                {/* Node Toggle Button */}
                <button className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center -mt-2.5 z-20 hover:bg-emerald-600 transition-colors">
                  <Minus size={12} strokeWidth={4} />
                </button>
              </div>

              {/* Children */}
              <ul>
                {/* CEO */}
                <li>
                  <OrgNode 
                    name="Angeline Beier"
                    title="CEO"
                    dept="Pixel Office"
                    image="1"
                    expanded={false}
                  />
                </li>

                {/* CTO */}
                <li>
                  <OrgNode 
                    name="Alfredo George"
                    title="CTO"
                    dept="Pixel Office"
                    image="2"
                    expanded={false}
                  />
                </li>

                {/* CFO */}
                <li>
                  <OrgNode 
                    name="Davis Levin"
                    title="CFO"
                    dept="Pixel Office"
                    image="3"
                    expanded={false}
                  />
                </li>

                {/* CPO (Has Children) */}
                <li>
                  <OrgNode 
                    name="Carla Workman"
                    title="CPO"
                    dept="Pixel Office"
                    image="4"
                    expanded={true}
                    toggleIcon={<Minus size={12} strokeWidth={4} />}
                  />
                  <ul>
                    <li>
                      <OrgNode 
                        name="Corey Lipshutz"
                        title="Project Manager"
                        dept="Team Project"
                        image="5"
                        expanded={false}
                      />
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

function OrgNode({ name, title, dept, image, expanded, toggleIcon = <Plus size={12} strokeWidth={4} /> }) {
  return (
    <div className="flex flex-col items-center relative">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-[160px] flex flex-col items-center shadow-sm z-10 relative bg-clip-padding">
        <div className="w-12 h-12 rounded-full overflow-hidden mb-3 bg-slate-100">
          <img 
            src={`https://i.pravatar.cc/150?u=${image}`} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-[12px] font-extrabold text-slate-900 dark:text-white text-center leading-tight mb-1">{name}</h3>
        <p className="text-[10px] font-bold text-slate-500 mb-2">{title}</p>
        <p className="text-[10px] font-medium text-slate-400">{dept}</p>
      </div>
      
      <button className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center -mt-2.5 z-20 hover:bg-emerald-600 transition-colors">
        {toggleIcon}
      </button>
    </div>
  );
}

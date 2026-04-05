# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.js >> Homepage Accessibility >> should not have any automatically detectable accessibility issues
- Location: tests\accessibility.spec.js:5:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 828

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\"><p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p><p class=\"text-indigo-600 font-black leading-none text-xl\">₹11/km</p></div>",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(1) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(1) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\">",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(1) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Capacity</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(1) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\"><p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p><p class=\"text-indigo-600 font-black leading-none text-xl\">₹12/km</p></div>",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(2) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(2) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\">",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(2) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Capacity</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(2) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\"><p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p><p class=\"text-indigo-600 font-black leading-none text-xl\">₹15/km</p></div>",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(3) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(3) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\">",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(3) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Capacity</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(3) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\"><p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p><p class=\"text-indigo-600 font-black leading-none text-xl\">₹15/km</p></div>",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(4) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(4) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\">",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(4) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Capacity</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(4) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\"><p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p><p class=\"text-indigo-600 font-black leading-none text-xl\">₹16/km</p></div>",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(5) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(5) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\">",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(5) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Capacity</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(5) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\"><p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p><p class=\"text-indigo-600 font-black leading-none text-xl\">₹21/km</p></div>",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(6) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Starting From</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(6) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(1) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fafc",
+               "contrastRatio": 2.45,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#94a3b8",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"border-slate-100 bg-slate-50 border p-3 rounded-xl\">",
+                 "target": Array [
+                   ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(6) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.45 (foreground color: #94a3b8, background color: #f8fafc, font size: 7.5pt (10px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"font-bold text-[10px] uppercase mb-1 text-slate-400 tracking-wider\">Capacity</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".md\\:snap-align-none.md\\:w-auto.opacity-100:nth-child(6) > .hover\\:shadow-xl.hover\\:-translate-y-1.border-slate-200 > .flex-1.p-6.flex-col > .mb-6.grid-cols-2.grid > .bg-slate-50.p-3.border-slate-100:nth-child(2) > .text-slate-400.tracking-wider.uppercase",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/tirupati-package/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "a[href$=\"tirupati-package/\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Book Tirupati Balaji Darshan Package </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"tirupati-package/\"] > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-orange-700.text-orange-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/thiruvannamalai-girivalam-trip/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   ".mb-12[data-astro-cid-pycgp2iy=\"\"] > .scrollbar-hide.snap-x.overflow-x-auto > .sm\\:w-72.w-64.cursor-pointer:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Book Thiruvannamalai Girivalam (1 Day / Night Trip) </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".sm\\:w-72.w-64.cursor-pointer:nth-child(2) > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-orange-700.text-orange-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/chidambaram-temple-trip/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   ".mb-12[data-astro-cid-pycgp2iy=\"\"] > .scrollbar-hide.snap-x.overflow-x-auto > .sm\\:w-72.w-64.cursor-pointer:nth-child(3)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Book Chidambaram Natarajar Temple Trip </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".sm\\:w-72.w-64.cursor-pointer:nth-child(3) > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-orange-700.text-orange-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/rameswaram-2-days/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "a[href$=\"rameswaram-2-days/\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Book Rameswaram (2-Day Trip) </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"rameswaram-2-days/\"] > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-orange-700.text-orange-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/navagraha-tour/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "a[href$=\"navagraha-tour/\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Book Navagraha Temple Tour (1 Day or 2 Days) </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"navagraha-tour/\"] > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-orange-700.text-orange-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/sabarimala-trip/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "a[href$=\"sabarimala-trip/\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.55 (foreground color: #ea580c, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Book Sabarimala Yatra 2025-26 (Chennai to Pamba) </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"sabarimala-trip/\"] > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-orange-700.text-orange-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f9fafb",
+               "contrastRatio": 3.4,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#ea580c",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.4 (foreground color: #ea580c, background color: #f9fafb, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"bg-gray-50 md:py-16 py-10\" id=\"tours\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "#tours",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.4 (foreground color: #ea580c, background color: #f9fafb, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<a href=\"/services/category/temple-tours/\" class=\"items-center font-bold inline-flex text-sm transition hover:text-orange-700 text-orange-600\" data-astro-cid-pycgp2iy=\"\">View All <i class=\"fas fa-arrow-right ml-2\" data-astro-cid-pycgp2iy=\"\"></i></a>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".hover\\:text-orange-700",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.29,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#16a34a",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/pondicherry-one-day-trip/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "div[data-astro-cid-pycgp2iy=\"\"]:nth-child(2) > .scrollbar-hide.snap-x.overflow-x-auto > .sm\\:w-72.w-64.cursor-pointer:nth-child(1)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Explore Pondicherry Day Trip </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".sm\\:w-72.w-64.cursor-pointer:nth-child(1) > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-green-700.text-green-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.29,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#16a34a",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/mahabalipuram-ecr-temple-route/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "div[data-astro-cid-pycgp2iy=\"\"]:nth-child(2) > .scrollbar-hide.snap-x.overflow-x-auto > .sm\\:w-72.w-64.cursor-pointer:nth-child(2)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Explore Mahabalipuram &amp; ECR Temples </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".sm\\:w-72.w-64.cursor-pointer:nth-child(2) > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-green-700.text-green-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.29,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#16a34a",
+               "fontSize": "9.0pt (12px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<a href=\"/services/one-day-chennai-city-tour/\" class=\"overflow-hidden rounded-xl bg-white border border-gray-100 w-64 block cursor-pointer flex-none group hover:shadow-md shadow-sm sm:w-72 snap-center transition\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "div[data-astro-cid-pycgp2iy=\"\"]:nth-child(2) > .scrollbar-hide.snap-x.overflow-x-auto > .sm\\:w-72.w-64.cursor-pointer:nth-child(3)",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.29 (foreground color: #16a34a, background color: #ffffff, font size: 9.0pt (12px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<span data-astro-cid-pycgp2iy=\"\">Explore Chennai City Sightseeing (1 Day Trip) </span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".sm\\:w-72.w-64.cursor-pointer:nth-child(3) > .p-4[data-astro-cid-pycgp2iy=\"\"] > .group-hover\\:text-green-700.text-green-600.tracking-wide > span[data-astro-cid-pycgp2iy=\"\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f9fafb",
+               "contrastRatio": 3.15,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#16a34a",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.15 (foreground color: #16a34a, background color: #f9fafb, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"bg-gray-50 md:py-16 py-10\" id=\"tours\" data-astro-cid-pycgp2iy=\"\">",
+                 "target": Array [
+                   "#tours",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.15 (foreground color: #16a34a, background color: #f9fafb, font size: 10.5pt (14px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<a href=\"/services/category/popular-destinations/\" class=\"items-center font-bold inline-flex text-sm transition hover:text-green-700 text-green-600\" data-astro-cid-pycgp2iy=\"\">View All <i class=\"fas fa-arrow-right ml-2\" data-astro-cid-pycgp2iy=\"\"></i></a>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".hover\\:text-green-700",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - navigation "Main Navigation" [ref=e3]:
    - generic [ref=e5]:
      - link "Kalidass Travels home" [ref=e7] [cursor=pointer]:
        - /url: /
        - img "Kalidass Travels logo" [ref=e8]
      - text: 
      - generic [ref=e9]:
        - link "Switch to Tamil" [ref=e11] [cursor=pointer]:
          - /url: /ta
          - generic [ref=e12]: தமிழ்
          - generic [ref=e13]: 
        - button "Open mobile menu" [ref=e14] [cursor=pointer]:
          - img [ref=e15]
  - dialog "Mobile Navigation" [ref=e17]:
    - button "Close mobile menu" [ref=e19] [cursor=pointer]:
      - img [ref=e20]
    - generic [ref=e22]:
      - link "Home" [ref=e23] [cursor=pointer]:
        - /url: /
      - link "Fleet" [ref=e24] [cursor=pointer]:
        - /url: /#fleet
      - link "Drivers" [ref=e25] [cursor=pointer]:
        - /url: /drivers/
      - link "Calculator" [ref=e26] [cursor=pointer]:
        - /url: /calculator/
      - generic [ref=e27]:
        - button "Services" [ref=e28] [cursor=pointer]:
          - generic [ref=e29]: Services
          - img [ref=e30]
        - generic [ref=e32]:
          - link "Acting Drivers" [ref=e33] [cursor=pointer]:
            - /url: /services/category/acting-drivers
          - link "Corporate Travel" [ref=e34] [cursor=pointer]:
            - /url: /services/category/corporate
          - link "Temple Tours" [ref=e35] [cursor=pointer]:
            - /url: /services/category/temple-tours
          - link "Popular Destinations" [ref=e36] [cursor=pointer]:
            - /url: /services/category/popular-destinations
      - generic [ref=e37]:
        - img "Proprietor Perumal Manikumar" [ref=e39]
        - heading "Perumal Manikumar" [level=3] [ref=e40]
        - paragraph [ref=e41]: PROPRIETOR
  - main [ref=e42]:
    - generic [ref=e43]:
      - generic [ref=e44]:
        - generic:
          - generic:
            - img
          - generic:
            - img
          - generic:
            - img
      - generic [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]: ●
          - paragraph [ref=e49]: Trusted by 1,000+ Families
        - heading "Premium Taxi Service Chennai & South India" [level=1] [ref=e50]:
          - generic [ref=e51]: Premium Taxi Service
          - generic [ref=e52]: Chennai & South India
        - paragraph [ref=e53]: Safe, reliable, and professional transportation at transparent rates. Temple tours, airport transfers & corporate travel.
        - link "Book Your Ride Now" [ref=e55] [cursor=pointer]:
          - /url: "#booking-panel"
          - generic [ref=e56]: Book Your Ride Now
          - img [ref=e57]
      - link "Scroll to booking form" [ref=e59] [cursor=pointer]:
        - /url: "#booking-panel"
        - img [ref=e60]
    - generic [ref=e64]:
      - generic [ref=e66]:
        - img [ref=e67]
        - generic [ref=e71]:
          - heading "Book your Ride" [level=2] [ref=e72]
          - paragraph [ref=e73]: Get Instant Quote
      - generic [ref=e75]:
        - button "One Way" [ref=e76] [cursor=pointer]:
          - img [ref=e77]
          - generic [ref=e79]: One Way
        - button "Round Trip" [ref=e80] [cursor=pointer]:
          - img [ref=e81]
          - generic [ref=e86]: Round Trip
        - button "Local Package" [ref=e87] [cursor=pointer]:
          - img [ref=e88]
          - generic [ref=e91]: Local Package
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]: Pickup Location
          - generic [ref=e96]:
            - button "Use current location for pickup" [ref=e97] [cursor=pointer]:
              - img [ref=e98]
            - textbox "Pickup Location" [ref=e101]:
              - /placeholder: Enter Pickup City / Area
        - generic [ref=e102]:
          - generic [ref=e103]: Drop Location
          - generic [ref=e104]:
            - button "Use current location for drop" [ref=e105] [cursor=pointer]:
              - img [ref=e106]
            - textbox "Drop Location" [ref=e109]:
              - /placeholder: Enter Drop City / Area
        - generic [ref=e110]:
          - generic [ref=e111]:
            - generic [ref=e112]: Passengers
            - generic [ref=e113]:
              - img [ref=e114]
              - combobox "Passengers" [ref=e119]:
                - option "4 Pax + Driver" [selected]
                - option "6 Pax + Driver"
                - option "7 Pax + Driver"
                - option "12 Pax + Driver"
          - generic [ref=e120]:
            - generic [ref=e121]: Vehicle
            - generic [ref=e122]:
              - img [ref=e123]
              - combobox "Vehicle" [ref=e127] [cursor=pointer]:
                - option "Swift Dzire" [selected]
                - option "Toyota Etios"
                - option "Innova"
                - option "Innova Crysta"
                - option "Tempo Traveller"
        - button "Calculate Cost" [ref=e128] [cursor=pointer]:
          - text: Calculate Cost
          - img [ref=e129]
    - generic [ref=e132]:
      - generic [ref=e133]:
        - heading "Our Premium Travel Services" [level=2] [ref=e134]: Our Premium Travel Services
        - paragraph [ref=e136]: From specialized Temple Tours to Corporate Employee Transport, we provide safe and reliable taxi services across Chennai and Tamil Nadu.
      - generic [ref=e137]:
        - link "Kalidass Travels - Acting Drivers Acting Drivers Book Acting Drivers " [ref=e138] [cursor=pointer]:
          - /url: /services/category/acting-drivers/
          - img "Kalidass Travels - Acting Drivers" [ref=e139]
          - generic [ref=e141]:
            - heading "Acting Drivers" [level=3] [ref=e142]
            - generic [ref=e143]:
              - generic [ref=e144]: Book Acting Drivers
              - generic [ref=e145]: 
        - link "Kalidass Travels - Corporate Corporate Book Corporate " [ref=e146] [cursor=pointer]:
          - /url: /services/category/corporate/
          - img "Kalidass Travels - Corporate" [ref=e147]
          - generic [ref=e149]:
            - heading "Corporate" [level=3] [ref=e150]
            - generic [ref=e151]:
              - generic [ref=e152]: Book Corporate
              - generic [ref=e153]: 
        - link "Kalidass Travels - Temple Tours Temple Tours Book Temple Tours " [ref=e154] [cursor=pointer]:
          - /url: /services/category/temple-tours/
          - img "Kalidass Travels - Temple Tours" [ref=e155]
          - generic [ref=e157]:
            - heading "Temple Tours" [level=3] [ref=e158]
            - generic [ref=e159]:
              - generic [ref=e160]: Book Temple Tours
              - generic [ref=e161]: 
        - link "Kalidass Travels - Popular Destinations Popular Destinations Book Popular Destinations " [ref=e162] [cursor=pointer]:
          - /url: /services/category/popular-destinations/
          - img "Kalidass Travels - Popular Destinations" [ref=e163]
          - generic [ref=e165]:
            - heading "Popular Destinations" [level=3] [ref=e166]
            - generic [ref=e167]:
              - generic [ref=e168]: Book Popular Destinations
              - generic [ref=e169]: 
    - region "Our Premium Fleet" [ref=e171]:
      - generic [ref=e172]:
        - generic [ref=e173]:
          - heading "Our Premium Fleet" [level=2] [ref=e174]: Our Premium Fleet
          - paragraph [ref=e176]: Choose from our well-maintained fleet of vehicles for your journey
        - region "Fleet Gallery" [ref=e178]:
          - generic [ref=e180]:
            - generic [ref=e181]:
              - img "Swift Dzire" [ref=e182]
              - generic [ref=e185]:
                - img [ref=e186]
                - text: Sanitized Every Trip
              - heading "Swift Dzire" [level=3] [ref=e190]
            - generic [ref=e191]:
              - generic [ref=e192]:
                - generic [ref=e193]:
                  - paragraph [ref=e194]: Starting From
                  - paragraph [ref=e195]: ₹11/km
                - generic [ref=e196]:
                  - paragraph [ref=e197]: Capacity
                  - generic [ref=e198]:
                    - img [ref=e199]
                    - paragraph [ref=e204]: 4 Passenger + Driver
              - generic [ref=e205]:
                - generic [ref=e206]:
                  - img [ref=e208]
                  - generic [ref=e211]: Best for City rides and Small family
                - generic [ref=e212]:
                  - img [ref=e214]
                  - generic [ref=e217]: AC and Entertainment
                - generic [ref=e218]:
                  - img [ref=e220]
                  - generic [ref=e223]: Daily/Outstation
          - generic [ref=e225]:
            - generic [ref=e226]:
              - img "Toyota Etios" [ref=e227]
              - generic [ref=e230]:
                - img [ref=e231]
                - text: Sanitized Every Trip
              - heading "Toyota Etios" [level=3] [ref=e235]
            - generic [ref=e236]:
              - generic [ref=e237]:
                - generic [ref=e238]:
                  - paragraph [ref=e239]: Starting From
                  - paragraph [ref=e240]: ₹12/km
                - generic [ref=e241]:
                  - paragraph [ref=e242]: Capacity
                  - generic [ref=e243]:
                    - img [ref=e244]
                    - paragraph [ref=e249]: 4 Passenger + Driver
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - img [ref=e253]
                  - generic [ref=e256]: Executive Sedan for Client Visits & Site Meetings
                - generic [ref=e257]:
                  - img [ref=e259]
                  - generic [ref=e262]: Best for Small family and city rides
                - generic [ref=e263]:
                  - img [ref=e265]
                  - generic [ref=e268]: AC and Entertainment
                - generic [ref=e269]:
                  - img [ref=e271]
                  - generic [ref=e274]: Corporate Travels
          - generic [ref=e276]:
            - generic [ref=e277]:
              - img "Innova" [ref=e278]
              - generic [ref=e281]:
                - img [ref=e282]
                - text: Sanitized Every Trip
              - heading "Innova" [level=3] [ref=e286]
            - generic [ref=e287]:
              - generic [ref=e288]:
                - generic [ref=e289]:
                  - paragraph [ref=e290]: Starting From
                  - paragraph [ref=e291]: ₹15/km
                - generic [ref=e292]:
                  - paragraph [ref=e293]: Capacity
                  - generic [ref=e294]:
                    - img [ref=e295]
                    - paragraph [ref=e300]: 7 Passenger + Driver
              - generic [ref=e301]:
                - generic [ref=e302]:
                  - img [ref=e304]
                  - generic [ref=e307]: Executive Sedan for Client Visits & Site Meetings
                - generic [ref=e308]:
                  - img [ref=e310]
                  - generic [ref=e313]: Best for Large family and Outstation
                - generic [ref=e314]:
                  - img [ref=e316]
                  - generic [ref=e319]: AC and Entertainment
                - generic [ref=e320]:
                  - img [ref=e322]
                  - generic [ref=e325]: Spacious
                - generic [ref=e326]:
                  - img [ref=e328]
                  - generic [ref=e331]: "Max weight capacity: 350kg"
          - generic [ref=e333]:
            - generic [ref=e334]:
              - img "Mahindra Bolero" [ref=e335]
              - generic [ref=e337]:
                - generic [ref=e338]:
                  - img [ref=e339]
                  - text: Sanitized Every Trip
                - generic [ref=e342]:
                  - img [ref=e343]
                  - text: Hill Specialist
              - heading "Mahindra Bolero" [level=3] [ref=e346]
            - generic [ref=e347]:
              - generic [ref=e348]:
                - generic [ref=e349]:
                  - paragraph [ref=e350]: Starting From
                  - paragraph [ref=e351]: ₹15/km
                - generic [ref=e352]:
                  - paragraph [ref=e353]: Capacity
                  - generic [ref=e354]:
                    - img [ref=e355]
                    - paragraph [ref=e360]: 7 Passenger + Driver
              - generic [ref=e361]:
                - generic [ref=e362]:
                  - img [ref=e364]
                  - generic [ref=e367]: Best for Large family and Outstation
                - generic [ref=e368]:
                  - img [ref=e370]
                  - generic [ref=e373]: AC and Entertainment
                - generic [ref=e374]:
                  - img [ref=e376]
                  - generic [ref=e379]: Best for Mountain ride and long trip
                - generic [ref=e380]:
                  - img [ref=e382]
                  - generic [ref=e385]: Rugged
          - generic [ref=e387]:
            - generic [ref=e388]:
              - img "Tata Sumo" [ref=e389]
              - generic [ref=e391]:
                - generic [ref=e392]:
                  - img [ref=e393]
                  - text: Sanitized Every Trip
                - generic [ref=e396]:
                  - img [ref=e397]
                  - text: Hill Specialist
              - heading "Tata Sumo" [level=3] [ref=e400]
            - generic [ref=e401]:
              - generic [ref=e402]:
                - generic [ref=e403]:
                  - paragraph [ref=e404]: Starting From
                  - paragraph [ref=e405]: ₹16/km
                - generic [ref=e406]:
                  - paragraph [ref=e407]: Capacity
                  - generic [ref=e408]:
                    - img [ref=e409]
                    - paragraph [ref=e414]: 7 Passenger + Driver
              - generic [ref=e415]:
                - generic [ref=e416]:
                  - img [ref=e418]
                  - generic [ref=e421]: Best for Large family and outstation
                - generic [ref=e422]:
                  - img [ref=e424]
                  - generic [ref=e427]: AC and Entertainment
                - generic [ref=e428]:
                  - img [ref=e430]
                  - generic [ref=e433]: Spacious
                - generic [ref=e434]:
                  - img [ref=e436]
                  - generic [ref=e439]: Best for Mountain ride and long trip
          - generic [ref=e441]:
            - generic [ref=e442]:
              - img "Tempo Traveller" [ref=e443]
              - generic [ref=e446]:
                - img [ref=e447]
                - text: Sanitized Every Trip
              - heading "Tempo Traveller" [level=3] [ref=e451]
            - generic [ref=e452]:
              - generic [ref=e453]:
                - generic [ref=e454]:
                  - paragraph [ref=e455]: Starting From
                  - paragraph [ref=e456]: ₹21/km
                - generic [ref=e457]:
                  - paragraph [ref=e458]: Capacity
                  - generic [ref=e459]:
                    - img [ref=e460]
                    - paragraph [ref=e465]: 12 Passenger + Driver
              - generic [ref=e466]:
                - generic [ref=e467]:
                  - img [ref=e469]
                  - generic [ref=e472]: Perfect for Corporate Team Outings & Offsites
                - generic [ref=e473]:
                  - img [ref=e475]
                  - generic [ref=e478]: Best for Group trips and hill stations
                - generic [ref=e479]:
                  - img [ref=e481]
                  - generic [ref=e484]: Push back seats
    - generic [ref=e493]:
      - generic [ref=e494]:
        - generic [ref=e495]:
          - heading "Popular Temple Trips" [level=2] [ref=e496]: Popular Temple Trips
          - paragraph [ref=e498]: Sacred pilgrimages and spiritual journeys.
        - generic [ref=e499]:
          - link "Tirupati Balaji Temple darshan package with taxi service from Chennai PILGRIMAGE Tirupati Balaji Darshan Package Complete darshan package with accommodation assistance and guided darshan. Book Tirupati Balaji Darshan Package " [ref=e500] [cursor=pointer]:
            - /url: /services/tirupati-package/
            - generic [ref=e501]:
              - img "Tirupati Balaji Temple darshan package with taxi service from Chennai" [ref=e502]
              - generic [ref=e503]: PILGRIMAGE
            - generic [ref=e504]:
              - heading "Tirupati Balaji Darshan Package" [level=3] [ref=e505]
              - paragraph [ref=e506]: Complete darshan package with accommodation assistance and guided darshan.
              - generic [ref=e507]:
                - generic [ref=e508]: Book Tirupati Balaji Darshan Package
                - generic [ref=e509]: 
          - link "Thiruvannamalai Girivalam full moon day trip from Chennai PILGRIMAGE Thiruvannamalai Girivalam (1 Day / Night Trip) A peaceful spiritual trip for Girivalam or temple darshan. Trip Info - Chennai → Thiruvannamalai → Chennai - 250 km approx - Popular for Pournami Girivalam Book Thiruvannamalai Girivalam (1 Day / Night Trip) " [ref=e510] [cursor=pointer]:
            - /url: /services/thiruvannamalai-girivalam-trip/
            - generic [ref=e511]:
              - img "Thiruvannamalai Girivalam full moon day trip from Chennai" [ref=e512]
              - generic [ref=e513]: PILGRIMAGE
            - generic [ref=e514]:
              - heading "Thiruvannamalai Girivalam (1 Day / Night Trip)" [level=3] [ref=e515]
              - paragraph [ref=e516]: A peaceful spiritual trip for Girivalam or temple darshan. Trip Info - Chennai → Thiruvannamalai → Chennai - 250 km approx - Popular for Pournami Girivalam
              - generic [ref=e517]:
                - generic [ref=e518]: Book Thiruvannamalai Girivalam (1 Day / Night Trip)
                - generic [ref=e519]: 
          - link "Chidambaram Nataraja Temple spiritual visit taxi service PILGRIMAGE Chidambaram Natarajar Temple Trip A spiritually rich trip with a relaxed journey. Book Chidambaram Natarajar Temple Trip " [ref=e520] [cursor=pointer]:
            - /url: /services/chidambaram-temple-trip/
            - generic [ref=e521]:
              - img "Chidambaram Nataraja Temple spiritual visit taxi service" [ref=e522]
              - generic [ref=e523]: PILGRIMAGE
            - generic [ref=e524]:
              - heading "Chidambaram Natarajar Temple Trip" [level=3] [ref=e525]
              - paragraph [ref=e526]: A spiritually rich trip with a relaxed journey.
              - generic [ref=e527]:
                - generic [ref=e528]: Book Chidambaram Natarajar Temple Trip
                - generic [ref=e529]: 
          - link "Rameswaram 2-day pilgrimage tour including Dhanushkodi beach PILGRIMAGE Rameswaram (2-Day Trip) Long, peaceful coastal travel. Suitable for families & senior devotees. Book Rameswaram (2-Day Trip) " [ref=e530] [cursor=pointer]:
            - /url: /services/rameswaram-2-days/
            - generic [ref=e531]:
              - img "Rameswaram 2-day pilgrimage tour including Dhanushkodi beach" [ref=e532]
              - generic [ref=e533]: PILGRIMAGE
            - generic [ref=e534]:
              - heading "Rameswaram (2-Day Trip)" [level=3] [ref=e535]
              - paragraph [ref=e536]: Long, peaceful coastal travel. Suitable for families & senior devotees.
              - generic [ref=e537]:
                - generic [ref=e538]: Book Rameswaram (2-Day Trip)
                - generic [ref=e539]: 
          - link "Complete Navagraha temple tour package Kumbakonam taxi PILGRIMAGE Navagraha Temple Tour (1 Day or 2 Days) A complete spiritual journey covering the nine planetary temples (Navagrahas) around Kumbakonam. This trip is designed to help you complete your pariharams and prayers with peace of mind. Book Navagraha Temple Tour (1 Day or 2 Days) " [ref=e540] [cursor=pointer]:
            - /url: /services/navagraha-tour/
            - generic [ref=e541]:
              - img "Complete Navagraha temple tour package Kumbakonam taxi" [ref=e542]
              - generic [ref=e543]: PILGRIMAGE
            - generic [ref=e544]:
              - heading "Navagraha Temple Tour (1 Day or 2 Days)" [level=3] [ref=e545]
              - paragraph [ref=e546]: A complete spiritual journey covering the nine planetary temples (Navagrahas) around Kumbakonam. This trip is designed to help you complete your pariharams and prayers with peace of mind.
              - generic [ref=e547]:
                - generic [ref=e548]: Book Navagraha Temple Tour (1 Day or 2 Days)
                - generic [ref=e549]: 
          - link "Sabarimala Mandala Pooja pilgrimage taxi package from Chennai PILGRIMAGE Sabarimala Yatra 2025-26 (Chennai to Pamba) A sacred journey to the abode of Lord Ayyappa. We understand the sanctity of the 41-day Vratham and ensure our drivers respect the spiritual atmosphere of your trip. Our vehicles are cleaned and prepared for the pilgrimage. Book Sabarimala Yatra 2025-26 (Chennai to Pamba) " [ref=e550] [cursor=pointer]:
            - /url: /services/sabarimala-trip/
            - generic [ref=e551]:
              - img "Sabarimala Mandala Pooja pilgrimage taxi package from Chennai" [ref=e552]
              - generic [ref=e553]: PILGRIMAGE
            - generic [ref=e554]:
              - heading "Sabarimala Yatra 2025-26 (Chennai to Pamba)" [level=3] [ref=e555]
              - paragraph [ref=e556]: A sacred journey to the abode of Lord Ayyappa. We understand the sanctity of the 41-day Vratham and ensure our drivers respect the spiritual atmosphere of your trip. Our vehicles are cleaned and prepared for the pilgrimage.
              - generic [ref=e557]:
                - generic [ref=e558]: Book Sabarimala Yatra 2025-26 (Chennai to Pamba)
                - generic [ref=e559]: 
        - link "View All " [ref=e561] [cursor=pointer]:
          - /url: /services/category/temple-tours/
          - text: View All
          - generic [ref=e562]: 
      - generic [ref=e563]:
        - generic [ref=e564]:
          - heading "Popular Destinations" [level=2] [ref=e565]: Popular Destinations
          - paragraph [ref=e567]: Explore heritage sites, beaches, and city tours.
        - generic [ref=e568]:
          - link "Pondicherry one day sightseeing trip from Chennai by car DESTINATION Pondicherry Day Trip Escape to the French Riviera of the East. Visit the serene Auroville, the beautiful Promenade Beach, Manakula Vinayagar Temple, and the French Colony. Perfect for a one-day getaway with family or friends. Explore Pondicherry Day Trip " [ref=e569] [cursor=pointer]:
            - /url: /services/pondicherry-one-day-trip/
            - generic [ref=e570]:
              - img "Pondicherry one day sightseeing trip from Chennai by car" [ref=e571]
              - generic [ref=e572]: DESTINATION
            - generic [ref=e573]:
              - heading "Pondicherry Day Trip" [level=3] [ref=e574]
              - paragraph [ref=e575]: Escape to the French Riviera of the East. Visit the serene Auroville, the beautiful Promenade Beach, Manakula Vinayagar Temple, and the French Colony. Perfect for a one-day getaway with family or friends.
              - generic [ref=e576]:
                - generic [ref=e577]: Explore Pondicherry Day Trip
                - generic [ref=e578]: 
          - link "Mahabalipuram and ECR temple heritage tour taxi DESTINATION Mahabalipuram & ECR Temples Explore the UNESCO World Heritage sites of Mahabalipuram including the Shore Temple, Five Rathas, and Arjuna's Penance. Enjoy a scenic drive along the East Coast Road (ECR) with options to visit other temples en route. Explore Mahabalipuram & ECR Temples " [ref=e579] [cursor=pointer]:
            - /url: /services/mahabalipuram-ecr-temple-route/
            - generic [ref=e580]:
              - img "Mahabalipuram and ECR temple heritage tour taxi" [ref=e581]
              - generic [ref=e582]: DESTINATION
            - generic [ref=e583]:
              - heading "Mahabalipuram & ECR Temples" [level=3] [ref=e584]
              - paragraph [ref=e585]: Explore the UNESCO World Heritage sites of Mahabalipuram including the Shore Temple, Five Rathas, and Arjuna's Penance. Enjoy a scenic drive along the East Coast Road (ECR) with options to visit other temples en route.
              - generic [ref=e586]:
                - generic [ref=e587]: Explore Mahabalipuram & ECR Temples
                - generic [ref=e588]: 
          - link "Chennai local city sightseeing day tour cab service DESTINATION Chennai City Sightseeing (1 Day Trip) Explore Chennai’s iconic locations with a flexible plan. Visit ancient temples, colonial monuments, and the vibrant Marina Beach. Explore Chennai City Sightseeing (1 Day Trip) " [ref=e589] [cursor=pointer]:
            - /url: /services/one-day-chennai-city-tour/
            - generic [ref=e590]:
              - img "Chennai local city sightseeing day tour cab service" [ref=e591]
              - generic [ref=e592]: DESTINATION
            - generic [ref=e593]:
              - heading "Chennai City Sightseeing (1 Day Trip)" [level=3] [ref=e594]
              - paragraph [ref=e595]: Explore Chennai’s iconic locations with a flexible plan. Visit ancient temples, colonial monuments, and the vibrant Marina Beach.
              - generic [ref=e596]:
                - generic [ref=e597]: Explore Chennai City Sightseeing (1 Day Trip)
                - generic [ref=e598]: 
        - link "View All " [ref=e600] [cursor=pointer]:
          - /url: /services/category/popular-destinations/
          - text: View All
          - generic [ref=e601]: 
    - generic [ref=e603]:
      - generic [ref=e604]:
        - heading "Trusted By Industry Leaders" [level=2] [ref=e605]: Trusted By Industry Leaders
        - paragraph [ref=e607]: Proud to serve these esteemed organizations
      - region "Partner Logos" [ref=e609]:
        - img "Airport Authority of India - Official taxi partner for Chennai Airport pickup and drop" [ref=e612]
        - img "Larsen & Toubro (L&T) Construction Chennai - Corporate employee transport partner" [ref=e615]
        - img "Reliance Jio Infocomm - Monthly cab services for corporate staff in Chennai" [ref=e618]
        - img "Savaari Car Rentals - Trusted local taxi operator partner" [ref=e621]
        - img "Saravn Enterprises - Dedicated logistics and staff transport provider" [ref=e624]
        - img "Cognizant Technology Solutions - IT employee daily commute partner" [ref=e627]
        - img "Tamil Nadu Police - Trusted vehicle provider for official duties" [ref=e630]
        - img "Mahindra Logistics - Official transport partner" [ref=e633]
        - img "Kaleesuwari Refinery Private Limited - Trusted corporate partner" [ref=e636]
    - region "Our Professional Drivers" [ref=e656]:
      - generic [ref=e657]:
        - generic [ref=e658]:
          - heading "Our Professional Drivers" [level=2] [ref=e659]: Our Professional Drivers
          - paragraph [ref=e661]: Experienced, verified, and multilingual drivers at your service.
        - region "Drivers List" [ref=e662]:
          - generic [ref=e663]:
            - generic [ref=e664]:
              - img "Perumal Manikumar" [ref=e665]
              - generic [ref=e667]: Owner
            - generic [ref=e668]:
              - heading "Perumal Manikumar" [level=3] [ref=e669]
              - generic [ref=e670]:
                - img [ref=e671]
                - generic [ref=e673]: "4.9"
            - generic [ref=e674]:
              - img [ref=e675]
              - text: PVC Verified
            - generic [ref=e678]:
              - generic [ref=e679]:
                - img [ref=e680]
                - generic [ref=e683]: 12 Years Experience
              - generic [ref=e684]:
                - img [ref=e685]
                - generic [ref=e689]: Tamil, English, Hindi
            - paragraph [ref=e691]: Perumal Manikumar has 12 Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e692]:
            - generic [ref=e693]:
              - img "Perumal Karthik Kumar" [ref=e694]
              - generic [ref=e696]: Managing Partner
            - generic [ref=e697]:
              - heading "Perumal Karthik Kumar" [level=3] [ref=e698]
              - generic [ref=e699]:
                - img [ref=e700]
                - generic [ref=e702]: "4.9"
            - generic [ref=e703]:
              - img [ref=e704]
              - text: PVC Verified
            - generic [ref=e707]:
              - generic [ref=e708]:
                - img [ref=e709]
                - generic [ref=e712]: 10 Years Experience
              - generic [ref=e713]:
                - img [ref=e714]
                - generic [ref=e718]: Tamil, English, Hindi
            - paragraph [ref=e720]: Perumal Karthik Kumar has 10 Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e721]:
            - generic [ref=e722]:
              - img "Hariharan" [ref=e723]
              - generic [ref=e725]: Driver
            - generic [ref=e726]:
              - heading "Hariharan" [level=3] [ref=e727]
              - generic [ref=e728]:
                - img [ref=e729]
                - generic [ref=e731]: "4.7"
            - generic [ref=e732]:
              - img [ref=e733]
              - text: PVC Verified
            - generic [ref=e736]:
              - generic [ref=e737]:
                - img [ref=e738]
                - generic [ref=e741]: 2 Year Experience
              - generic [ref=e742]:
                - img [ref=e743]
                - generic [ref=e747]: Tamil, English, Hindi
            - paragraph [ref=e749]: Hariharan has 2 Year Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e750]:
            - generic [ref=e751]:
              - img "Raj" [ref=e752]
              - generic [ref=e754]: Driver
            - generic [ref=e755]:
              - heading "Raj" [level=3] [ref=e756]
              - generic [ref=e757]:
                - img [ref=e758]
                - generic [ref=e760]: "4.6"
            - generic [ref=e761]:
              - img [ref=e762]
              - text: PVC Verified
            - generic [ref=e765]:
              - generic [ref=e766]:
                - img [ref=e767]
                - generic [ref=e770]: 5 Years Experience
              - generic [ref=e771]:
                - img [ref=e772]
                - generic [ref=e776]: Tamil, English, Hindi
            - paragraph [ref=e778]: Raj has 5 Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e779]:
            - generic [ref=e780]:
              - img "Munish" [ref=e781]
              - generic [ref=e783]: Driver
            - generic [ref=e784]:
              - heading "Munish" [level=3] [ref=e785]
              - generic [ref=e786]:
                - img [ref=e787]
                - generic [ref=e789]: "4.8"
            - generic [ref=e790]:
              - img [ref=e791]
              - text: PVC Verified
            - generic [ref=e794]:
              - generic [ref=e795]:
                - img [ref=e796]
                - generic [ref=e799]: 6+ Years Experience
              - generic [ref=e800]:
                - img [ref=e801]
                - generic [ref=e805]: Tamil, English, Hindi
            - paragraph [ref=e807]: Munish has 6+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e808]:
            - generic [ref=e809]:
              - img "Vishnu" [ref=e810]
              - generic [ref=e812]: Driver
            - generic [ref=e813]:
              - heading "Vishnu" [level=3] [ref=e814]
              - generic [ref=e815]:
                - img [ref=e816]
                - generic [ref=e818]: "4.8"
            - generic [ref=e819]:
              - img [ref=e820]
              - text: PVC Verified
            - generic [ref=e823]:
              - generic [ref=e824]:
                - img [ref=e825]
                - generic [ref=e828]: 8+ Years Experience
              - generic [ref=e829]:
                - img [ref=e830]
                - generic [ref=e834]: Tamil, English, Hindi
            - paragraph [ref=e836]: Vishnu has 8+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e837]:
            - generic [ref=e838]:
              - img "Thangaraj" [ref=e839]
              - generic [ref=e841]: Driver
            - generic [ref=e842]:
              - heading "Thangaraj" [level=3] [ref=e843]
              - generic [ref=e844]:
                - img [ref=e845]
                - generic [ref=e847]: "4.9"
            - generic [ref=e848]:
              - img [ref=e849]
              - text: PVC Verified
            - generic [ref=e852]:
              - generic [ref=e853]:
                - img [ref=e854]
                - generic [ref=e857]: 25+ Years Experience
              - generic [ref=e858]:
                - img [ref=e859]
                - generic [ref=e863]: Tamil, English, Hindi
            - paragraph [ref=e865]: Thangaraj has 25+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e866]:
            - generic [ref=e867]:
              - img "Senthamil" [ref=e868]
              - generic [ref=e870]: Driver
            - generic [ref=e871]:
              - heading "Senthamil" [level=3] [ref=e872]
              - generic [ref=e873]:
                - img [ref=e874]
                - generic [ref=e876]: "4.9"
            - generic [ref=e877]:
              - img [ref=e878]
              - text: PVC Verified
            - generic [ref=e881]:
              - generic [ref=e882]:
                - img [ref=e883]
                - generic [ref=e886]: 20+ Years Experience
              - generic [ref=e887]:
                - img [ref=e888]
                - generic [ref=e892]: Tamil, English, Hindi
            - paragraph [ref=e894]: Senthamil has 20+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e895]:
            - generic [ref=e896]:
              - img "Prakash" [ref=e897]
              - generic [ref=e899]: Driver
            - generic [ref=e900]:
              - heading "Prakash" [level=3] [ref=e901]
              - generic [ref=e902]:
                - img [ref=e903]
                - generic [ref=e905]: "4.8"
            - generic [ref=e906]:
              - img [ref=e907]
              - text: PVC Verified
            - generic [ref=e910]:
              - generic [ref=e911]:
                - img [ref=e912]
                - generic [ref=e915]: 15+ Years Experience
              - generic [ref=e916]:
                - img [ref=e917]
                - generic [ref=e921]: Tamil, English, Hindi
            - paragraph [ref=e923]: Prakash has 15+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e924]:
            - generic [ref=e925]:
              - img "Elumalai" [ref=e926]
              - generic [ref=e928]: Driver
            - generic [ref=e929]:
              - heading "Elumalai" [level=3] [ref=e930]
              - generic [ref=e931]:
                - img [ref=e932]
                - generic [ref=e934]: "4.9"
            - generic [ref=e935]:
              - img [ref=e936]
              - text: PVC Verified
            - generic [ref=e939]:
              - generic [ref=e940]:
                - img [ref=e941]
                - generic [ref=e944]: 21+ Years Experience
              - generic [ref=e945]:
                - img [ref=e946]
                - generic [ref=e950]: Tamil, English, Hindi
            - paragraph [ref=e952]: Elumalai has 21+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e953]:
            - generic [ref=e954]:
              - img "Venkateshan" [ref=e955]
              - generic [ref=e957]: Driver
            - generic [ref=e958]:
              - heading "Venkateshan" [level=3] [ref=e959]
              - generic [ref=e960]:
                - img [ref=e961]
                - generic [ref=e963]: "4.7"
            - generic [ref=e964]:
              - img [ref=e965]
              - text: PVC Verified
            - generic [ref=e968]:
              - generic [ref=e969]:
                - img [ref=e970]
                - generic [ref=e973]: 15+ Years Experience
              - generic [ref=e974]:
                - img [ref=e975]
                - generic [ref=e979]: Tamil, English, Hindi
            - paragraph [ref=e981]: Venkateshan has 15+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e982]:
            - generic [ref=e983]:
              - img "Mani" [ref=e984]
              - generic [ref=e986]: Driver
            - generic [ref=e987]:
              - heading "Mani" [level=3] [ref=e988]
              - generic [ref=e989]:
                - img [ref=e990]
                - generic [ref=e992]: "4.8"
            - generic [ref=e993]:
              - img [ref=e994]
              - text: PVC Verified
            - generic [ref=e997]:
              - generic [ref=e998]:
                - img [ref=e999]
                - generic [ref=e1002]: 10+ Years Experience
              - generic [ref=e1003]:
                - img [ref=e1004]
                - generic [ref=e1008]: Tamil, English, Hindi
            - paragraph [ref=e1010]: Mani has 10+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e1011]:
            - generic [ref=e1012]:
              - img "Neelakandan" [ref=e1013]
              - generic [ref=e1015]: Driver
            - generic [ref=e1016]:
              - heading "Neelakandan" [level=3] [ref=e1017]
              - generic [ref=e1018]:
                - img [ref=e1019]
                - generic [ref=e1021]: "4.9"
            - generic [ref=e1022]:
              - img [ref=e1023]
              - text: PVC Verified
            - generic [ref=e1026]:
              - generic [ref=e1027]:
                - img [ref=e1028]
                - generic [ref=e1031]: 18+ Years Experience
              - generic [ref=e1032]:
                - img [ref=e1033]
                - generic [ref=e1037]: Tamil, English, Hindi
            - paragraph [ref=e1039]: Neelakandan has 18+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e1040]:
            - generic [ref=e1041]:
              - img "Karthick" [ref=e1042]
              - generic [ref=e1044]: Driver
            - generic [ref=e1045]:
              - heading "Karthick" [level=3] [ref=e1046]
              - generic [ref=e1047]:
                - img [ref=e1048]
                - generic [ref=e1050]: "4.8"
            - generic [ref=e1051]:
              - img [ref=e1052]
              - text: PVC Verified
            - generic [ref=e1055]:
              - generic [ref=e1056]:
                - img [ref=e1057]
                - generic [ref=e1060]: 13+ Years Experience
              - generic [ref=e1061]:
                - img [ref=e1062]
                - generic [ref=e1066]: Tamil, English, Hindi
            - paragraph [ref=e1068]: Karthick has 13+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e1069]:
            - generic [ref=e1070]:
              - img "Natraj" [ref=e1071]
              - generic [ref=e1073]: Driver
            - generic [ref=e1074]:
              - heading "Natraj" [level=3] [ref=e1075]
              - generic [ref=e1076]:
                - img [ref=e1077]
                - generic [ref=e1079]: "5.0"
            - generic [ref=e1080]:
              - img [ref=e1081]
              - text: PVC Verified
            - generic [ref=e1084]:
              - generic [ref=e1085]:
                - img [ref=e1086]
                - generic [ref=e1089]: 25+ Years Experience
              - generic [ref=e1090]:
                - img [ref=e1091]
                - generic [ref=e1095]: Tamil, English, Hindi
            - paragraph [ref=e1097]: Natraj has 25+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e1098]:
            - generic [ref=e1099]:
              - img "Vijay" [ref=e1100]
              - generic [ref=e1102]: Driver
            - generic [ref=e1103]:
              - heading "Vijay" [level=3] [ref=e1104]
              - generic [ref=e1105]:
                - img [ref=e1106]
                - generic [ref=e1108]: "4.7"
            - generic [ref=e1109]:
              - img [ref=e1110]
              - text: PVC Verified
            - generic [ref=e1113]:
              - generic [ref=e1114]:
                - img [ref=e1115]
                - generic [ref=e1118]: 7+ Years Experience
              - generic [ref=e1119]:
                - img [ref=e1120]
                - generic [ref=e1124]: Tamil, English, Hindi
            - paragraph [ref=e1126]: Vijay has 7+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e1127]:
            - generic [ref=e1128]:
              - img "Murugan" [ref=e1129]
              - generic [ref=e1131]: Driver
            - generic [ref=e1132]:
              - heading "Murugan" [level=3] [ref=e1133]
              - generic [ref=e1134]:
                - img [ref=e1135]
                - generic [ref=e1137]: "4.9"
            - generic [ref=e1138]:
              - img [ref=e1139]
              - text: PVC Verified
            - generic [ref=e1142]:
              - generic [ref=e1143]:
                - img [ref=e1144]
                - generic [ref=e1147]: 20+ Years Experience
              - generic [ref=e1148]:
                - img [ref=e1149]
                - generic [ref=e1153]: Tamil, English, Hindi
            - paragraph [ref=e1155]: Murugan has 20+ Years Experience and is fluent in Tamil, English, Hindi.
          - generic [ref=e1156]:
            - generic [ref=e1157]:
              - img "Vadivel" [ref=e1158]
              - generic [ref=e1160]: Driver
            - generic [ref=e1161]:
              - heading "Vadivel" [level=3] [ref=e1162]
              - generic [ref=e1163]:
                - img [ref=e1164]
                - generic [ref=e1166]: "4.8"
            - generic [ref=e1167]:
              - img [ref=e1168]
              - text: PVC Verified
            - generic [ref=e1171]:
              - generic [ref=e1172]:
                - img [ref=e1173]
                - generic [ref=e1176]: 12+ Years Experience
              - generic [ref=e1177]:
                - img [ref=e1178]
                - generic [ref=e1182]: Tamil, English, Hindi
            - paragraph [ref=e1184]: Vadivel has 12+ Years Experience and is fluent in Tamil, English, Hindi.
        - link "View All Drivers" [ref=e1186] [cursor=pointer]:
          - /url: /drivers
          - text: View All Drivers
          - img [ref=e1187]
    - generic [ref=e1191]:
      - generic [ref=e1192]:
        - heading "Client Reviews" [level=2] [ref=e1193]: Client Reviews
        - paragraph [ref=e1195]: Hear from our happy customers about their journey with us.
      - region "Client Reviews" [ref=e1196]:
        - generic [ref=e1198]:
          - generic [ref=e1199]:
            - generic [ref=e1200]:
              - generic [ref=e1201]: R
              - generic [ref=e1202]:
                - generic [ref=e1203]: Rajesh K
                - img "Rated 5 out of 5 stars" [ref=e1204]:
                  - generic [ref=e1205]: 
                  - generic [ref=e1206]: 
                  - generic [ref=e1207]: 
                  - generic [ref=e1208]: 
                  - generic [ref=e1209]: 
            - generic [ref=e1211]: 
          - paragraph [ref=e1212]: "\"Excellent service for our Tirupati trip. Driver Vadivel was very polite.\""
        - generic [ref=e1214]:
          - generic [ref=e1215]:
            - generic [ref=e1216]:
              - generic [ref=e1217]: A
              - generic [ref=e1218]:
                - generic [ref=e1219]: Anita Roy
                - img "Rated 5 out of 5 stars" [ref=e1220]:
                  - generic [ref=e1221]: 
                  - generic [ref=e1222]: 
                  - generic [ref=e1223]: 
                  - generic [ref=e1224]: 
                  - generic [ref=e1225]: 
            - generic [ref=e1227]: 
          - paragraph [ref=e1228]: "\"Clean Innova Crysta and punctual pickup. Transparent pricing.\""
        - generic [ref=e1230]:
          - generic [ref=e1231]:
            - generic [ref=e1232]:
              - generic [ref=e1233]: S
              - generic [ref=e1234]:
                - generic [ref=e1235]: Suresh M
                - img "Rated 5 out of 5 stars" [ref=e1236]:
                  - generic [ref=e1237]: 
                  - generic [ref=e1238]: 
                  - generic [ref=e1239]: 
                  - generic [ref=e1240]: 
                  - generic [ref=e1241]: 
            - generic [ref=e1243]: 
          - paragraph [ref=e1244]: "\"Very safe driving for my parents' trip to Kumbakonam.\""
      - link "See More Reviews on Google (opens in a new tab)" [ref=e1246] [cursor=pointer]:
        - /url: https://maps.app.goo.gl/i2LdJhWMi2ZgAiCa8
        - text: See More Reviews on Google
        - generic [ref=e1247]: 
    - generic [ref=e1249]:
      - generic [ref=e1250]:
        - heading "Common Questions About Taxi Services in Chennai" [level=2] [ref=e1251]
        - paragraph [ref=e1252]: Find answers to frequently asked questions about our temple tours, corporate travel, and outstation cabs.
      - generic [ref=e1253]:
        - group [ref=e1254]:
          - generic "Do you offer one-way drops from Chennai to other cities?" [ref=e1255] [cursor=pointer]:
            - generic [ref=e1256]: Do you offer one-way drops from Chennai to other cities?
            - img [ref=e1258]
        - group [ref=e1260]:
          - generic "What vehicles are available for temple tour packages?" [ref=e1261] [cursor=pointer]:
            - generic [ref=e1262]: What vehicles are available for temple tour packages?
            - img [ref=e1264]
        - group [ref=e1266]:
          - generic "Are driver batta and toll charges included?" [ref=e1267] [cursor=pointer]:
            - generic [ref=e1268]: Are driver batta and toll charges included?
            - img [ref=e1270]
        - group [ref=e1272]:
          - generic "Do you offer airport pickup and drop services?" [ref=e1273] [cursor=pointer]:
            - generic [ref=e1274]: Do you offer airport pickup and drop services?
            - img [ref=e1276]
        - group [ref=e1278]:
          - generic "Can I book a cab for local Chennai sightseeing?" [ref=e1279] [cursor=pointer]:
            - generic [ref=e1280]: Can I book a cab for local Chennai sightseeing?
            - img [ref=e1282]
        - group [ref=e1284]:
          - generic "Is it safe for night travel?" [ref=e1285] [cursor=pointer]:
            - generic [ref=e1286]: Is it safe for night travel?
            - img [ref=e1288]
        - group [ref=e1290]:
          - generic "How do I pay for the ride?" [ref=e1291] [cursor=pointer]:
            - generic [ref=e1292]: How do I pay for the ride?
            - img [ref=e1294]
        - group [ref=e1296]:
          - generic "Do you offer corporate employee transportation?" [ref=e1297] [cursor=pointer]:
            - generic [ref=e1298]: Do you offer corporate employee transportation?
            - img [ref=e1300]
        - group [ref=e1302]:
          - generic "Can I customize my tour package?" [ref=e1303] [cursor=pointer]:
            - generic [ref=e1304]: Can I customize my tour package?
            - img [ref=e1306]
        - group [ref=e1308]:
          - generic "How far in advance should I book?" [ref=e1309] [cursor=pointer]:
            - generic [ref=e1310]: How far in advance should I book?
            - img [ref=e1312]
    - generic [ref=e1315]:
      - generic [ref=e1316]:
        - heading "Travel Awareness & Safety" [level=2] [ref=e1317]: Travel Awareness & Safety
        - paragraph [ref=e1319]: Your safety is our priority. Verified resources and emergency contacts.
      - generic [ref=e1320]:
        - generic [ref=e1321]:
          - img [ref=e1323]
          - heading "Travel Responsibility" [level=3] [ref=e1326]
          - generic [ref=e1327]: Important safety & responsible travel guidelines for passengers.
          - button "View Checklist" [ref=e1328] [cursor=pointer]
        - generic [ref=e1329]:
          - img [ref=e1331]
          - heading "Official Govt. Resources" [level=3] [ref=e1335]
          - generic [ref=e1336]: Verified Tamil Nadu Government tourism & travel portals.
          - button "View" [ref=e1337] [cursor=pointer]
        - generic [ref=e1338]:
          - img [ref=e1340]
          - heading "Kaaval Uthavi App" [level=3] [ref=e1348]
          - generic [ref=e1349]: Get quick police assistance, SOS alerts, emergency location sharing.
          - link "Download App" [ref=e1350] [cursor=pointer]:
            - /url: https://play.google.com/store/apps/details?id=com.amtexsystems.kaavaluthavi&hl=en_IN
        - generic [ref=e1351]:
          - img [ref=e1353]
          - heading "Emergency Helpline" [level=3] [ref=e1355]
          - generic [ref=e1356]: "Police: 100 Ambulance: 108 National Emergency: 112 Women Helpline: 1091 Highway Patrol: 103"
          - link "Call Now" [ref=e1357] [cursor=pointer]:
            - /url: tel:100
      - text:    
  - contentinfo [ref=e1358]:
    - generic [ref=e1360]:
      - img "Kalidass Travels" [ref=e1362]
      - paragraph [ref=e1363]: "GSTIN : 33COVPM0531D1Z4"
      - paragraph [ref=e1364]: No. 4/220, E88, Ponniamman Kovil Street, Annamalai Nagar, Medavakkam, Chennai - 600 100.
      - link "View on Google Maps" [ref=e1365] [cursor=pointer]:
        - /url: https://maps.google.com/?q=Kalidass+Travels+Medavakkam+Chennai
      - paragraph [ref=e1367]: © 2026 Kalidass Travels | All rights reserved.
      - paragraph [ref=e1368]:
        - text: Built by
        - link "Saravn" [ref=e1369] [cursor=pointer]:
          - /url: https://wa.me/919952749408?text=Hi%20Saravn,%20I%20saw%20your%20work%20on%20Kalidass%20Travels%20website.
    - link "Call Kalidass Travels" [ref=e1370] [cursor=pointer]:
      - /url: tel:+919092303060
      - img [ref=e1372]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | 
  4  | test.describe('Homepage Accessibility', () => {
  5  |     test('should not have any automatically detectable accessibility issues', async ({ page }) => {
  6  |         await page.goto('/');
  7  | 
  8  |         // Wait for content to load
  9  |         await page.waitForSelector('main', { state: 'visible' });
  10 | 
  11 |         const accessibilityScanResults = await new AxeBuilder({ page })
  12 |             .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  13 |             .analyze();
  14 | 
> 15 |         expect(accessibilityScanResults.violations).toEqual([]);
     |                                                     ^ Error: expect(received).toEqual(expected) // deep equality
  16 |     });
  17 | 
  18 |     test('should have a skip to content link', async ({ page }) => {
  19 |         await page.goto('/');
  20 |         // Press tab to focus the skip link
  21 |         await page.keyboard.press('Tab');
  22 |         const skipLink = page.locator('a[href="#main-content"]');
  23 |         await expect(skipLink).toBeVisible();
  24 |         await expect(skipLink).toBeFocused();
  25 |     });
  26 | });
  27 | 
  28 | test.describe('Keyboard Navigation', () => {
  29 |     test('Mobile menu should be keyboard accessible', async ({ page }) => {
  30 |         // Set viewport to mobile
  31 |         await page.setViewportSize({ width: 375, height: 667 });
  32 |         await page.goto('/');
  33 | 
  34 |         const menuBtn = page.getByLabel('Open mobile menu');
  35 |         await expect(menuBtn).toBeVisible();
  36 |         await menuBtn.click();
  37 | 
  38 |         const drawer = page.locator('#mobile-menu-drawer');
  39 |         await expect(drawer).toBeVisible();
  40 | 
  41 |         // Check if focus is trapped or moved to menu (implementation specific, checking visibility for now)
  42 |         const firstLink = drawer.getByRole('link').first();
  43 |         await expect(firstLink).toBeVisible();
  44 |     });
  45 | });
  46 | 
```
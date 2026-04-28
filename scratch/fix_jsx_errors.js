
const fs = require('fs');

// 1. Fix page.tsx (Home)
let homePath = 'src/app/page.tsx';
let home = fs.readFileSync(homePath, 'utf8');

// Fix the missing closing fragment in the if (locaisAtivos === 0) block
home = home.replace(
    '</Link>\n      </div>\n    );',
    '</Link>\n      </div>\n    </>\n    );'
);

// Fix the main return too
if (home.includes('return (\n    <>\n      <div className="page-header">') && !home.includes('</>\n  );\n}')) {
    // We need to find the last return and wrap it
    const lastReturnIndex = home.lastIndexOf('return (');
    if (lastReturnIndex !== -1) {
        // home = home.substring(0, lastReturnIndex) + ...
    }
}

fs.writeFileSync(homePath, home, 'utf8');

// 2. Fix plantao-extra/page.tsx
let extraPath = 'src/app/plantao-extra/page.tsx';
let extra = fs.readFileSync(extraPath, 'utf8');

// Fix the skeleton return
extra = extra.replace(
    '</div>\n    );',
    '</div>\n    </>\n    );'
);

// Fix the messed up card content
// I'll just restore the card structure properly
extra = extra.replace(
    '<div className="card">\n          \n          </div>',
    '<div className="card">'
);

fs.writeFileSync(extraPath, extra, 'utf8');

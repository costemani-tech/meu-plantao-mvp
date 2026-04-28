
const fs = require('fs');

// 1. Fix page.tsx (Home)
let homePath = 'src/app/page.tsx';
let home = fs.readFileSync(homePath, 'utf8');

// Fix the first return (locaisAtivos === 0)
home = home.replace(
    '</Link>\n      </div>\n    );',
    '</Link>\n      </div>\n    </>\n    );'
);

// Fix the second return (the main one)
// I didn't add the fragment here yet.
home = home.replace(
    'return (\n    <div style={{ padding: "16px 16px 120px 16px", maxWidth: "600px", margin: "0 auto" }}>',
    'return (\n    <>\n      <div className="page-header">\n        <h1>Olá, {userName}!</h1>\n        <p>Acompanhe sua escala e ganhos para o mês de {new Date().toLocaleDateString("pt-BR", { month: "long" })}.</p>\n      </div>\n      <div style={{ padding: "16px 16px 120px 16px", maxWidth: "600px", margin: "0 auto" }}>'
);

// Add the closing fragment at the end of the main return
home = home.replace(
    '<DashboardInteractive isPro={isPro} hasLocations={hasLocations} />\n    </div>\n  );\n}',
    '<DashboardInteractive isPro={isPro} hasLocations={hasLocations} />\n    </div>\n    </>\n  );\n}'
);

fs.writeFileSync(homePath, home, 'utf8');

// 2. Fix plantao-extra/page.tsx
let extraPath = 'src/app/plantao-extra/page.tsx';
let extra = fs.readFileSync(extraPath, 'utf8');

// Fix the skeleton return
extra = extra.replace(
    '</p>\n      </div>\n      <div style={{ padding: 24, display: \'flex\', justifyContent: \'center\' }}>\n        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: \'50%\' }} />\n      </div>\n    );',
    '</p>\n      </div>\n      <div style={{ padding: 24, display: \'flex\', justifyContent: \'center\' }}>\n        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: \'50%\' }} />\n      </div>\n    </>\n    );'
);

// Fix the card content (ensure it's not messed up)
if (extra.includes('<div className="card">\n          \n          <div className="form-group">')) {
    // already fixed or okay
}

fs.writeFileSync(extraPath, extra, 'utf8');

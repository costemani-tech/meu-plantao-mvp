import re

files_to_fix = [
    'src/app/DashboardInteractive.tsx',
    'src/app/api/usuarios/excluir/route.ts',
    'src/app/calendario/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/demo/page.tsx',
    'src/app/escalas/page.tsx',
    'src/app/locais/page.tsx',
    'src/app/meu-plano/MeuPlanoClient.tsx',
    'src/app/notificacoes/page.tsx',
    'src/app/relatorio/page.tsx',
    'src/app/repasses/page.tsx',
    'src/components/AppShell.tsx',
    'src/components/ConsentBanner.tsx',
    'src/components/PremiumModal.tsx',
    'src/components/ShareAgendaModal.tsx',
    'src/components/ShareableScheduleCard.tsx',
    'src/lib/date-utils.ts'
]

def clean_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove all standard eslint-disable directives for react-hooks/set-state-in-effect
    content = re.sub(r"// eslint-disable-next-line react-hooks/set-state-in-effect\n", "", content)

    # General specific cleanups based on warnings we observed previously.
    # Note: We must be careful not to introduce syntax errors. Since these are only warnings
    # and previous attempts to modify TSX syntax caused severe parsing errors,
    # we will focus ONLY on unused imports that are simple to cleanly regex out,
    # or we can leave them if they pose risk of breaking the build, as warnings do not break build.

    # Given that warnings are acceptable and do not fail the build or tests,
    # and previous aggressive regex replacements broke the build,
    # we will only run `eslint --fix` natively.
    pass

for file in files_to_fix:
    try:
        clean_file(file)
    except Exception as e:
        print(f"Failed on {file}: {e}")

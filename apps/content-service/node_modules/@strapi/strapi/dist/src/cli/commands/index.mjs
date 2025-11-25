import { buildStrapiCloudCommands } from '@strapi/cloud-cli';
import { command } from './admin/create-user.mjs';
import { command as command$1 } from './admin/reset-user-password.mjs';
import { command as command$2 } from './components/list.mjs';
import { command as command$3 } from './configuration/dump.mjs';
import { command as command$4 } from './configuration/restore.mjs';
import { command as command$6 } from './content-types/list.mjs';
import { command as command$7 } from './controllers/list.mjs';
import { command as command$9 } from './hooks/list.mjs';
import { command as command$a } from './middlewares/list.mjs';
import { command as command$b } from './policies/list.mjs';
import { command as command$d } from './routes/list.mjs';
import { command as command$e } from './services/list.mjs';
import { command as command$g } from './telemetry/disable.mjs';
import { command as command$h } from './telemetry/enable.mjs';
import { command as command$i } from './templates/generate.mjs';
import { command as command$j } from './ts/generate-types.mjs';
import { command as command$l } from './build.mjs';
import { command as command$5 } from './console.mjs';
import { command as command$m } from './develop.mjs';
import { command as command$8 } from './generate.mjs';
import { command as command$c } from './report.mjs';
import { command as command$f } from './start.mjs';
import { command as command$k } from './version.mjs';
import { command as command$q } from './openapi/index.mjs';
import command$n from './export/command.mjs';
import command$o from './import/command.mjs';
import command$p from './transfer/command.mjs';

const commands = [
    command,
    command$1,
    command$2,
    command$3,
    command$4,
    command$5,
    command$6,
    command$7,
    command$8,
    command$9,
    command$a,
    command$b,
    command$c,
    command$d,
    command$e,
    command$f,
    command$g,
    command$h,
    command$i,
    command$j,
    command$k,
    command$l,
    command$m,
    command$n,
    command$o,
    command$p,
    command$q,
    /**
   * Cloud
   */ buildStrapiCloudCommands
];

export { commands };
//# sourceMappingURL=index.mjs.map

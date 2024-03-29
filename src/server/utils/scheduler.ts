import { Pool } from 'pg';
import config from '../config/config';

// TODO: Maybe should rewrite and document function
export async function addJob(taskName: string, payload?: any, options: any = {}) {
  try {
    const pool = new Pool({ connectionString: config.dbLink });
    const args = ['$1::text'];
    options.max_attempts ??= 1;
    const values = [taskName];
    if (payload) {
      args.push('payload := $2');
      values.push(JSON.stringify(payload));
    }

    if (options) {
      let argumentPos = values.length;
      ['queue_name', 'max_attempts', 'run_at', 'interval'].forEach((col) => {
        if (options[col]) {
          argumentPos++;
          if (col === 'interval') {
            args.push(`run_at := NOW() + ($${argumentPos} * INTERVAL '1 minute')`);
          } else {
            args.push(`${col} := $${argumentPos}`);
          }

          values.push(options[col]);
        }
      });
    }
    const query = `SELECT graphile_worker.add_job(${args.join(', ')});`;
    await pool.query(query, values);
    await pool.end();
  } catch (e) {
    console.log(e);
  }
}

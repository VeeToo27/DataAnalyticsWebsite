/**
 * Interactive SQL Studio & Particle Schema Mindmap Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 * Dark Themed SQL Editor with Full Template Insertion on Autocomplete/Tab, and Particle-Forming ER Mindmap.
 */

class SQLStudioEngine {
  constructor() {
    this.editorTextarea = document.getElementById('sql-editor-textarea');
    this.canvas = document.getElementById('sql-mindmap-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.autocompleteDropdown = document.getElementById('sql-autocomplete-dropdown');
    this.consoleOutput = document.getElementById('sql-console-output');
    this.runBtn = document.getElementById('sql-run-btn');

    // Schema Storage
    this.tables = [];
    this.relationships = [];
    this.particles = []; // Particle formation system

    // Drag / Interaction State
    this.draggedTable = null;
    this.dragOffset = { x: 0, y: 0 };
    this.hoveredTable = null;
    this.hoveredField = null;
    this.mouse = { x: -9999, y: -9999 };

    // Full Command Templates Dictionary (Provides ready-to-run multi-line code)
    this.sqlDictionary = [
      {
        text: 'CREATE TABLE',
        type: 'template',
        desc: 'Full new table template with PK, FK, data types',
        template: `CREATE TABLE new_dataset (\n  id INT PRIMARY KEY,\n  title VARCHAR(120) NOT NULL,\n  student_id INT REFERENCES students(student_id),\n  score FLOAT,\n  created_at TIMESTAMP\n);`
      },
      {
        text: 'CREATE TABLE (WITH FK)',
        type: 'template',
        desc: 'Table with foreign key relationship to students',
        template: `CREATE TABLE project_teams (\n  team_id INT PRIMARY KEY,\n  team_name VARCHAR(100) NOT NULL,\n  lead_student_id INT REFERENCES students(student_id),\n  domain_track VARCHAR(80),\n  formed_date TIMESTAMP\n);`
      },
      {
        text: 'SELECT JOIN',
        type: 'template',
        desc: 'Multi-table INNER JOIN query template',
        template: `SELECT \n  s.student_id,\n  s.full_name,\n  c.course_title,\n  c.platform\nFROM students s\nJOIN certifications c ON s.student_id = c.student_id\nWHERE c.platform = 'Coursera'\nORDER BY s.full_name ASC;`
      },
      {
        text: 'SELECT AGGREGATE',
        type: 'template',
        desc: 'GROUP BY aggregation query with COUNT & AVG',
        template: `SELECT \n  platform,\n  COUNT(*) AS total_certifications,\n  AVG(student_id) AS avg_student_id\nFROM certifications\nGROUP BY platform\nHAVING COUNT(*) > 0\nORDER BY total_certifications DESC;`
      },
      {
        text: 'INSERT INTO',
        type: 'template',
        desc: 'Insert row template with sample values',
        template: `INSERT INTO students (student_id, full_name, email, cohort_year, club_role)\nVALUES (101, 'Aarav Sharma', 'aarav@imsuc.ac.in', 2026, 'Data Analyst');`
      },
      {
        text: 'ALTER TABLE (ADD COLUMN)',
        type: 'template',
        desc: 'Add a new column to an existing table',
        template: `ALTER TABLE students \nADD COLUMN gpa FLOAT;`
      },
      {
        text: 'ALTER TABLE (ADD FOREIGN KEY)',
        type: 'template',
        desc: 'Link table column to another table PK',
        template: `ALTER TABLE workshops \nADD FOREIGN KEY (lead_id) REFERENCES students(student_id);`
      },
      {
        text: 'DROP TABLE',
        type: 'template',
        desc: 'Safely drop an existing table',
        template: `DROP TABLE IF EXISTS old_dataset;`
      },
      {
        text: 'CREATE VIEW',
        type: 'template',
        desc: 'Create virtual analytical view across tables',
        template: `CREATE VIEW active_leads_view AS\nSELECT \n  s.full_name, \n  s.club_role, \n  c.course_title \nFROM students s\nJOIN certifications c ON s.student_id = c.student_id;`
      },
      {
        text: 'UPDATE RECORDS',
        type: 'template',
        desc: 'Update column values with WHERE filter',
        template: `UPDATE students \nSET club_role = 'Senior Data Analyst'\nWHERE student_id = 1;`
      },
      {
        text: 'DELETE RECORDS',
        type: 'template',
        desc: 'Delete records matching condition',
        template: `DELETE FROM certifications \nWHERE status = 'Expired';`
      }
    ];

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    }, { passive: true });

    this.loadInitialSchema();
    this.bindEditorEvents();
    this.bindCanvasEvents();
    this.bindPresets();
    this.startRenderLoop();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = container.clientWidth || 700;
    this.height = Math.max(540, container.clientHeight || 540);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  loadInitialSchema() {
    // 1. Students Table
    this.createTableObject('students', [
      { name: 'student_id', type: 'INT', isPK: true, isFK: false },
      { name: 'full_name', type: 'VARCHAR(100)', isPK: false, isFK: false },
      { name: 'email', type: 'VARCHAR(150)', isPK: false, isFK: false },
      { name: 'cohort_year', type: 'INT', isPK: false, isFK: false },
      { name: 'club_role', type: 'VARCHAR(50)', isPK: false, isFK: false }
    ], 60, 80, true);

    // 2. Certifications Table
    this.createTableObject('certifications', [
      { name: 'cert_id', type: 'INT', isPK: true, isFK: false },
      { name: 'student_id', type: 'INT', isPK: false, isFK: true, refTable: 'students', refField: 'student_id' },
      { name: 'platform', type: 'VARCHAR(80)', isPK: false, isFK: false },
      { name: 'course_title', type: 'VARCHAR(180)', isPK: false, isFK: false },
      { name: 'issued_at', type: 'TIMESTAMP', isPK: false, isFK: false }
    ], 380, 50, true);

    // 3. Workshops Table
    this.createTableObject('workshops', [
      { name: 'workshop_id', type: 'INT', isPK: true, isFK: false },
      { name: 'lead_id', type: 'INT', isPK: false, isFK: true, refTable: 'students', refField: 'student_id' },
      { name: 'topic_track', type: 'VARCHAR(100)', isPK: false, isFK: false },
      { name: 'duration_hrs', type: 'INT', isPK: false, isFK: false }
    ], 380, 310, true);

    this.rebuildRelationships();
  }

  createTableObject(name, fields, x, y, animateParticles = true) {
    // Remove if exists
    this.tables = this.tables.filter(t => t.name.toLowerCase() !== name.toLowerCase());

    const table = {
      name: name,
      fields: fields,
      x: x || Math.random() * (this.width - 240) + 40,
      y: y || Math.random() * (this.height - 200) + 40,
      width: 220,
      height: 38 + fields.length * 24 + 10,
      color: this.getTableColor(name),
      isHovered: false
    };

    this.tables.push(table);

    if (animateParticles) {
      this.spawnFormationParticles(table);
    }

    this.rebuildRelationships();
    return table;
  }

  getTableColor(name) {
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const colors = ['#00a8e8', '#1e60d0', '#f59e0b', '#10b981', '#f97316', '#a855f7'];
    return colors[hash % colors.length];
  }

  // Particle Swirl & Assembly Effect for Table Creation
  spawnFormationParticles(table) {
    const count = 90;
    const centerX = table.x + table.width * 0.5;
    const centerY = table.y + table.height * 0.5;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 260 + 120;
      const startX = centerX + Math.cos(angle) * dist;
      const startY = centerY + Math.sin(angle) * dist;

      const targetX = table.x + Math.random() * table.width;
      const targetY = table.y + Math.random() * table.height;

      this.particles.push({
        x: startX,
        y: startY,
        targetX: targetX,
        targetY: targetY,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 2.5 + 1.2,
        color: table.color,
        alpha: 1.0,
        progress: 0,
        speed: Math.random() * 0.03 + 0.02
      });
    }

    // Shockwave burst ring
    this.particles.push({
      isShockwave: true,
      x: centerX,
      y: centerY,
      radius: 5,
      maxRadius: Math.max(table.width, table.height) * 0.8,
      color: table.color,
      alpha: 1.0
    });
  }

  rebuildRelationships() {
    this.relationships = [];

    this.tables.forEach(sourceTable => {
      sourceTable.fields.forEach((field, fieldIdx) => {
        if (field.isFK && field.refTable) {
          const targetTable = this.tables.find(t => t.name.toLowerCase() === field.refTable.toLowerCase());
          if (targetTable) {
            const targetFieldIdx = targetTable.fields.findIndex(f => f.name.toLowerCase() === (field.refField || 'id').toLowerCase());
            this.relationships.push({
              sourceTable,
              sourceField: field,
              sourceFieldIdx: fieldIdx,
              targetTable,
              targetFieldIdx: targetFieldIdx >= 0 ? targetFieldIdx : 0
            });
          }
        }
      });
    });
  }

  bindEditorEvents() {
    const editor = this.editorTextarea;
    if (!editor) return;

    // 1. Typing & Autocomplete Triggers
    editor.addEventListener('input', () => {
      this.handleAutocomplete();
    });

    // 2. Tab Key Listener (Command Palette Trigger)
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.showAllCommandsPalette();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.executeSQL();
      } else if (e.key === 'Escape') {
        this.hideAutocomplete();
      }
    });

    // 3. Run Button Click
    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => {
        this.executeSQL();
      });
    }

    // 4. Autocomplete Selection
    if (this.autocompleteDropdown) {
      this.autocompleteDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
          const templateIndex = parseInt(item.getAttribute('data-index'));
          const selected = this.sqlDictionary[templateIndex];
          if (selected) {
            this.insertFullTemplate(selected.template);
          }
        }
      });
    }

    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#sql-editor-container')) {
        this.hideAutocomplete();
      }
    });
  }

  handleAutocomplete() {
    const editor = this.editorTextarea;
    const pos = editor.selectionStart;
    const textBefore = editor.value.substring(0, pos);
    const words = textBefore.split(/[\s,()]+/);
    const currentWord = words[words.length - 1].toUpperCase();

    if (currentWord.length >= 2) {
      const matches = this.sqlDictionary.filter(item => item.text.toUpperCase().includes(currentWord));
      if (matches.length > 0) {
        this.renderAutocompleteDropdown(matches, 'Available SQL Templates [Click to Insert]');
        return;
      }
    }
    this.hideAutocomplete();
  }

  showAllCommandsPalette() {
    this.renderAutocompleteDropdown(this.sqlDictionary, 'All SQL Command Templates [TAB]');
  }

  renderAutocompleteDropdown(items, title = 'Suggestions') {
    if (!this.autocompleteDropdown) return;

    let html = `
      <div class="p-2 border-b border-slate-700/80 bg-slate-900/90 flex items-center justify-between text-[11px] text-cyan-400 font-mono font-bold">
        <span>${title}</span>
        <span class="text-[10px] text-slate-500 font-normal">Click to insert full template</span>
      </div>
      <div class="max-h-60 overflow-y-auto p-1">
    `;

    items.forEach((item) => {
      const globalIdx = this.sqlDictionary.indexOf(item);
      html += `
        <div class="autocomplete-item flex items-center justify-between p-2 rounded-md hover:bg-slate-800/90 cursor-pointer transition-colors" data-index="${globalIdx}">
          <div class="flex items-center gap-2">
            <span class="text-[10px] px-1.5 py-0.5 rounded border bg-cyan-950 text-cyan-400 border-cyan-700 font-mono font-bold uppercase">TEMPLATE</span>
            <span class="text-xs font-mono font-bold text-white">${item.text}</span>
          </div>
          <span class="text-[11px] text-slate-400 max-w-[200px] truncate text-right">${item.desc}</span>
        </div>
      `;
    });

    html += '</div>';

    this.autocompleteDropdown.innerHTML = html;
    this.autocompleteDropdown.classList.remove('hidden');
  }

  hideAutocomplete() {
    if (this.autocompleteDropdown) {
      this.autocompleteDropdown.classList.add('hidden');
    }
  }

  insertFullTemplate(templateCode) {
    const editor = this.editorTextarea;
    // Replace current text or set directly
    editor.value = templateCode;
    editor.focus();
    editor.selectionStart = editor.selectionEnd = templateCode.length;
    this.hideAutocomplete();
    this.logConsole('✓ Inserted complete SQL template. Click RUN SQL or press Ctrl+Enter to execute.', 'info');
  }

  // Parse and Execute SQL Commands
  executeSQL() {
    const query = (this.editorTextarea.value || '').trim();
    if (!query) return;

    this.logConsole('Executing query...', 'info');

    try {
      // 1. Parse CREATE TABLE
      const createMatch = query.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
      if (createMatch) {
        const tableName = createMatch[1];
        const body = createMatch[2];
        const fields = this.parseTableFields(body);

        // Position new table in open area
        const offsetX = (this.tables.length % 2 === 0) ? 60 : 380;
        const offsetY = Math.min(this.height - 240, 60 + Math.floor(this.tables.length / 2) * 220);

        this.createTableObject(tableName, fields, offsetX, offsetY, true);
        this.logConsole(`✓ Table '${tableName}' created successfully with ${fields.length} columns!`, 'success');
        return;
      }

      // 2. Parse ALTER TABLE ADD FOREIGN KEY
      const alterMatch = query.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([a-zA-Z0-9_]+)\)\s*REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i);
      if (alterMatch) {
        const sourceTable = alterMatch[1];
        const sourceField = alterMatch[2];
        const refTable = alterMatch[3];
        const refField = alterMatch[4];

        const targetTableObj = this.tables.find(t => t.name.toLowerCase() === sourceTable.toLowerCase());
        if (targetTableObj) {
          const fieldObj = targetTableObj.fields.find(f => f.name.toLowerCase() === sourceField.toLowerCase());
          if (fieldObj) {
            fieldObj.isFK = true;
            fieldObj.refTable = refTable;
            fieldObj.refField = refField;
            this.rebuildRelationships();
            this.logConsole(`✓ Foreign key relationship created: ${sourceTable}.${sourceField} -> ${refTable}.${refField}`, 'success');
            return;
          }
        }
      }

      // 3. Parse DROP TABLE
      const dropMatch = query.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (dropMatch) {
        const tableName = dropMatch[1];
        this.tables = this.tables.filter(t => t.name.toLowerCase() !== tableName.toLowerCase());
        this.rebuildRelationships();
        this.logConsole(`✓ Table '${tableName}' dropped from schema.`, 'success');
        return;
      }

      // 4. Generic Success for SELECT / INSERT
      if (/^SELECT/i.test(query)) {
        this.logConsole(`✓ SELECT executed: Query returned 42 rows in 6ms.`, 'success');
      } else if (/^INSERT/i.test(query)) {
        this.logConsole(`✓ 1 row inserted into database successfully.`, 'success');
      } else {
        this.logConsole(`✓ Command processed successfully.`, 'success');
      }
    } catch (err) {
      console.error(err);
      this.logConsole(`✕ SQL Syntax Error: ${err.message}`, 'error');
    }
  }

  parseTableFields(body) {
    const lines = body.split(',').map(l => l.trim()).filter(l => l.length > 0);
    const fields = [];

    lines.forEach(line => {
      // Check for standalone PRIMARY KEY (id)
      const pkStandalone = line.match(/^PRIMARY\s+KEY\s*\(([a-zA-Z0-9_]+)\)/i);
      if (pkStandalone) {
        const pkName = pkStandalone[1];
        const target = fields.find(f => f.name.toLowerCase() === pkName.toLowerCase());
        if (target) target.isPK = true;
        return;
      }

      // Check for standalone FOREIGN KEY
      const fkStandalone = line.match(/FOREIGN\s+KEY\s*\(([a-zA-Z0-9_]+)\)\s*REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i);
      if (fkStandalone) {
        const fkName = fkStandalone[1];
        const refTable = fkStandalone[2];
        const refField = fkStandalone[3];
        const target = fields.find(f => f.name.toLowerCase() === fkName.toLowerCase());
        if (target) {
          target.isFK = true;
          target.refTable = refTable;
          target.refField = refField;
        }
        return;
      }

      const tokens = line.split(/\s+/);
      if (tokens.length >= 2) {
        const name = tokens[0];
        const type = tokens[1];
        const isPK = /PRIMARY\s+KEY/i.test(line);
        const fkMatch = line.match(/REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i);

        fields.push({
          name: name,
          type: type,
          isPK: isPK,
          isFK: !!fkMatch,
          refTable: fkMatch ? fkMatch[1] : null,
          refField: fkMatch ? fkMatch[2] : null
        });
      }
    });

    return fields.length > 0 ? fields : [{ name: 'id', type: 'INT', isPK: true }];
  }

  logConsole(msg, type = 'info') {
    if (!this.consoleOutput) return;
    const color = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-cyan-400';
    const timestamp = new Date().toLocaleTimeString();
    this.consoleOutput.innerHTML = `[${timestamp}] <span class="${color}">${msg}</span>`;
  }

  bindCanvasEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find top-most table clicked
      for (let i = this.tables.length - 1; i >= 0; i--) {
        const table = this.tables[i];
        if (mouseX >= table.x && mouseX <= table.x + table.width &&
            mouseY >= table.y && mouseY <= table.y + table.height) {
          this.draggedTable = table;
          this.dragOffset.x = mouseX - table.x;
          this.dragOffset.y = mouseY - table.y;
          this.tables.splice(i, 1);
          this.tables.push(table);
          break;
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      if (this.draggedTable) {
        this.draggedTable.x = Math.max(10, Math.min(this.width - this.draggedTable.width - 10, this.mouse.x - this.dragOffset.x));
        this.draggedTable.y = Math.max(10, Math.min(this.height - this.draggedTable.height - 10, this.mouse.y - this.dragOffset.y));
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedTable = null;
    });
  }

  bindPresets() {
    const presetButtons = document.querySelectorAll('.sql-preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-preset');
        let sql = '';

        if (type === 'create-hackathons') {
          sql = `CREATE TABLE hackathons (\n  hackathon_id INT PRIMARY KEY,\n  title VARCHAR(120) NOT NULL,\n  lead_mentor_id INT REFERENCES students(student_id),\n  prize_pool FLOAT,\n  event_date TIMESTAMP\n);`;
        } else if (type === 'create-projects') {
          sql = `CREATE TABLE research_projects (\n  project_id INT PRIMARY KEY,\n  project_name VARCHAR(150) NOT NULL,\n  domain_track VARCHAR(80),\n  student_lead_id INT REFERENCES students(student_id)\n);`;
        } else if (type === 'join-query') {
          sql = `SELECT \n  s.full_name, \n  c.course_title, \n  c.platform \nFROM students s\nJOIN certifications c ON s.student_id = c.student_id\nWHERE c.platform = 'Coursera';`;
        }

        if (this.editorTextarea) {
          this.editorTextarea.value = sql;
          this.editorTextarea.focus();
        }
      });
    });
  }

  startRenderLoop() {
    const loop = (now) => {
      this.updateParticles();
      this.drawMindmap(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.isShockwave) {
        p.radius += 3.5;
        p.alpha -= 0.025;
        if (p.alpha <= 0 || p.radius >= p.maxRadius) {
          this.particles.splice(i, 1);
        }
        continue;
      }

      // Move particle towards target with spring ease
      p.progress = Math.min(1.0, p.progress + p.speed);

      p.x += (p.targetX - p.x) * 0.12;
      p.y += (p.targetY - p.y) * 0.12;

      if (p.progress >= 0.95) {
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  drawMindmap(now) {
    const w = this.width;
    const h = this.height;
    this.ctx.clearRect(0, 0, w, h);

    // 1. Tech Grid Background
    this.drawBackgroundGrid(w, h);

    // 2. Relationship Cables & Flowing Pulses
    this.drawRelationshipCables(now);

    // 3. Table Nodes
    this.tables.forEach(table => {
      this.drawTableNode(table);
    });

    // 4. Swirling Formation Particles & Shockwaves
    this.drawParticles();
  }

  drawBackgroundGrid(w, h) {
    this.ctx.strokeStyle = 'rgba(0, 168, 232, 0.04)';
    this.ctx.lineWidth = 1;
    const step = 28;

    for (let x = 0; x < w; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    for (let y = 0; y < h; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }
  }

  drawRelationshipCables(now) {
    this.relationships.forEach(rel => {
      const srcTable = rel.sourceTable;
      const tgtTable = rel.targetTable;

      const srcY = srcTable.y + 38 + rel.sourceFieldIdx * 24 + 12;
      const tgtY = tgtTable.y + 38 + rel.targetFieldIdx * 24 + 12;

      let srcX = srcTable.x + srcTable.width;
      let tgtX = tgtTable.x;

      if (srcTable.x > tgtTable.x) {
        srcX = srcTable.x;
        tgtX = tgtTable.x + tgtTable.width;
      }

      const dx = Math.abs(tgtX - srcX) * 0.5;

      // Glow Bezier Cable
      this.ctx.strokeStyle = 'rgba(0, 168, 232, 0.4)';
      this.ctx.lineWidth = 2.2;
      this.ctx.beginPath();
      this.ctx.moveTo(srcX, srcY);
      this.ctx.bezierCurveTo(srcX + (srcX < tgtX ? dx : -dx), srcY, tgtX + (srcX < tgtX ? -dx : dx), tgtY, tgtX, tgtY);
      this.ctx.stroke();

      // Flowing Energy Pulse
      const t = (now * 0.001) % 1.0;
      const pulseX = this.getBezierPoint(srcX, srcX + (srcX < tgtX ? dx : -dx), tgtX + (srcX < tgtX ? -dx : dx), tgtX, t);
      const pulseY = this.getBezierPoint(srcY, srcY, tgtY, tgtY, t);

      this.ctx.fillStyle = '#f59e0b';
      this.ctx.shadowColor = '#f59e0b';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(pulseX, pulseY, 3.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  getBezierPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  drawTableNode(table) {
    const isHover = (
      this.mouse.x >= table.x && this.mouse.x <= table.x + table.width &&
      this.mouse.y >= table.y && this.mouse.y <= table.y + table.height
    );

    // Card Glassmorphic Background
    this.ctx.fillStyle = 'rgba(10, 20, 36, 0.88)';
    this.ctx.strokeStyle = isHover ? '#00a8e8' : 'rgba(0, 168, 232, 0.28)';
    this.ctx.lineWidth = isHover ? 2 : 1.2;

    this.ctx.shadowColor = isHover ? 'rgba(0, 168, 232, 0.4)' : 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = isHover ? 18 : 12;

    this.ctx.beginPath();
    this.ctx.roundRect(table.x, table.y, table.width, table.height, 10);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Header Background
    this.ctx.fillStyle = isHover ? 'rgba(0, 168, 232, 0.2)' : 'rgba(15, 28, 50, 0.85)';
    this.ctx.beginPath();
    this.ctx.roundRect(table.x, table.y, table.width, 36, [10, 10, 0, 0]);
    this.ctx.fill();

    // Table Icon & Name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Outfit, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(table.name.toUpperCase(), table.x + 14, table.y + 22);

    // Row Count Tag
    this.ctx.fillStyle = table.color;
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('TABLE', table.x + table.width - 12, table.y + 22);

    // Fields List
    table.fields.forEach((field, idx) => {
      const fy = table.y + 38 + idx * 24 + 16;

      if (field.isPK) {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('PK', table.x + 24, fy);
      } else if (field.isFK) {
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.fillText('FK', table.x + 24, fy);
      } else {
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '9px monospace';
        this.ctx.fillText('•', table.x + 24, fy);
      }

      this.ctx.fillStyle = field.isPK ? '#f8fafc' : '#cbd5e1';
      this.ctx.font = field.isPK ? 'bold 11px Outfit, sans-serif' : '11px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(field.name, table.x + 36, fy);

      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(field.type, table.x + table.width - 12, fy);
    });
  }

  drawParticles() {
    this.particles.forEach(p => {
      if (p.isShockwave) {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        return;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1.0;
    });
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.sqlStudioEngine = new SQLStudioEngine();
});

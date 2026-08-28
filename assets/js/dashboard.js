/**
 * Interactive MS Excel-Style Multi-Column Data Dashboard & Big Data Engine
 * Data Analytics Club - IMSUCC Ghaziabad
 * Large Format Edition: Multi-Column, High-Load Data (1000+ rows), Sticky Headers, CSV Export, and 2.2s Majestic Morphing Charts.
 */

class DataDashboardEngine {
  constructor() {
    this.tableHead = document.getElementById('excel-table-head');
    this.tableBody = document.getElementById('excel-table-body');
    this.canvas = document.getElementById('dashboard-chart-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.currentChartType = 'bar'; // 'bar', 'pie', 'line'
    this.nameBox = document.getElementById('excel-name-box');
    this.formulaInput = document.getElementById('excel-formula-input');
    this.datasetSelect = document.getElementById('excel-dataset-select');
    this.dropzone = document.getElementById('excel-dropzone');
    this.fileInput = document.getElementById('excel-file-input');
    this.searchInput = document.getElementById('excel-search-input');

    // KPI Metric elements
    this.kpiTotal = document.getElementById('kpi-total-val');
    this.kpiAvg = document.getElementById('kpi-avg-val');
    this.kpiMax = document.getElementById('kpi-max-val');
    this.kpiCount = document.getElementById('kpi-count-val');

    this.colorPalette = ['#00a8e8', '#1e60d0', '#f59e0b', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#d946ef'];

    // Multi-Column Structure
    this.columns = [
      { id: 'cat', name: 'Domain / Program', type: 'label' },
      { id: 'col_1', name: 'Active Students', type: 'numeric', color: '#00a8e8' }
    ];

    // Initial Row Data
    this.rows = [
      { label: 'Machine Learning', values: { col_1: 420 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } },
      { label: 'Data Visualization', values: { col_1: 360 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } },
      { label: 'Big Data & SQL', values: { col_1: 280 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } },
      { label: 'Quant Analytics', values: { col_1: 210 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } },
      { label: 'Cloud AI', values: { col_1: 180 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } }
    ];

    this.filterQuery = '';

    // Predefined Multi-Column Datasets
    this.datasets = {
      domains: {
        columns: [
          { id: 'cat', name: 'Domain Area', type: 'label' },
          { id: 'col_1', name: 'Active Students', type: 'numeric', color: '#00a8e8' },
          { id: 'col_2', name: 'Certifications', type: 'numeric', color: '#f59e0b' }
        ],
        rows: [
          { label: 'Machine Learning', values: { col_1: 420, col_2: 350 } },
          { label: 'Data Visualization', values: { col_1: 360, col_2: 290 } },
          { label: 'Big Data & SQL', values: { col_1: 280, col_2: 240 } },
          { label: 'Quant Analytics', values: { col_1: 210, col_2: 170 } },
          { label: 'Cloud AI', values: { col_1: 180, col_2: 150 } },
          { label: 'Business Intelligence', values: { col_1: 260, col_2: 210 } },
          { label: 'Deep Learning & NLP', values: { col_1: 310, col_2: 270 } },
          { label: 'Data Engineering', values: { col_1: 240, col_2: 190 } }
        ]
      },
      growth: {
        columns: [
          { id: 'cat', name: 'Timeline Quarter', type: 'label' },
          { id: 'col_1', name: 'Workshops (Hours)', type: 'numeric', color: '#1e60d0' },
          { id: 'col_2', name: 'Participants', type: 'numeric', color: '#10b981' }
        ],
        rows: [
          { label: 'Q1 2025', values: { col_1: 140, col_2: 210 } },
          { label: 'Q2 2025', values: { col_1: 220, col_2: 340 } },
          { label: 'Q3 2025', values: { col_1: 310, col_2: 480 } },
          { label: 'Q4 2025', values: { col_1: 460, col_2: 650 } },
          { label: 'Q1 2026', values: { col_1: 580, col_2: 820 } },
          { label: 'Q2 2026 (Est)', values: { col_1: 720, col_2: 990 } }
        ]
      },
      tools: {
        columns: [
          { id: 'cat', name: 'Technology', type: 'label' },
          { id: 'col_1', name: 'Project Count', type: 'numeric', color: '#00a8e8' },
          { id: 'col_2', name: 'Skill Proficiency', type: 'numeric', color: '#f97316' }
        ],
        rows: [
          { label: 'Python & PyTorch', values: { col_1: 500, col_2: 420 } },
          { label: 'Power BI & Tableau', values: { col_1: 390, col_2: 350 } },
          { label: 'SQL & Warehousing', values: { col_1: 340, col_2: 310 } },
          { label: 'Excel & Modeling', values: { col_1: 260, col_2: 280 } },
          { label: 'R Analytics', values: { col_1: 150, col_2: 160 } },
          { label: 'Apache Spark', values: { col_1: 210, col_2: 190 } },
          { label: 'Snowflake & dbt', values: { col_1: 180, col_2: 170 } }
        ]
      }
    };

    // Animation Timing: 2200ms for slow, majestic, deliberate transitions
    this.animDuration = 2200;
    this.animStartTime = 0;
    this.isAnimating = false;

    this.kpiStart = { total: 0, avg: 0, max: 0 };
    this.kpiTarget = { total: 0, avg: 0, max: 0 };

    this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);
    this.mouse = { x: -9999, y: -9999, isHover: false };

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.isMobile = (window.innerWidth < 768) || ('ontouchstart' in window);
      this.resizeCanvas();
      this.drawChart();
    }, { passive: true });

    this.renderTable();
    this.triggerChartAnimation();
    this.bindEvents();
    this.bindDropzone();
    this.startRenderLoop();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const dpr = this.isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 2);
    this.width = container.clientWidth || 650;
    this.height = Math.max(520, container.clientHeight || 520);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  getNumericColumns() {
    return this.columns.filter(c => c.type === 'numeric');
  }

  // Render Spreadsheet with Search Filter & Sticky Header Support
  renderTable() {
    if (!this.tableHead || !this.tableBody) return;

    // 1. Render Table Header with Editable Column Names
    let headHtml = '<tr><th class="w-12 text-center text-xs">#</th>';
    this.columns.forEach((col, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx);
      if (col.type === 'label') {
        headHtml += `
          <th class="min-w-[170px]">
            <div class="excel-header-cell">
              <span class="font-mono text-emerald-600 font-extrabold mr-1 text-xs">${colLetter}:</span>
              <input type="text" class="excel-header-input col-name-input text-xs" data-col-id="${col.id}" value="${col.name}" spellcheck="false" title="Click to rename column">
            </div>
          </th>`;
      } else {
        headHtml += `
          <th class="min-w-[160px]">
            <div class="excel-header-cell">
              <div class="flex items-center gap-1.5 overflow-hidden">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${col.color};"></span>
                <span class="font-mono text-emerald-600 font-extrabold text-xs">${colLetter}:</span>
                <input type="text" class="excel-header-input col-name-input text-xs" data-col-id="${col.id}" value="${col.name}" spellcheck="false" title="Click to rename column">
              </div>
              ${this.getNumericColumns().length > 1 ? `
                <button class="delete-col-btn text-slate-400 hover:text-red-500 p-0.5" title="Delete Column ${colLetter}" data-col-id="${col.id}">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          </th>`;
      }
    });
    headHtml += '<th class="w-12 text-center text-xs">Act</th></tr>';
    this.tableHead.innerHTML = headHtml;

    // 2. Render Table Rows (Filter aware)
    this.tableBody.innerHTML = '';
    const query = this.filterQuery.toLowerCase();

    this.rows.forEach((row, rowIdx) => {
      if (query && !row.label.toLowerCase().includes(query)) return;

      const tr = document.createElement('tr');
      tr.className = 'excel-row';

      let rowHtml = `<td class="excel-cell-index">${rowIdx + 1}</td>`;

      this.columns.forEach((col, colIdx) => {
        const colLetter = String.fromCharCode(65 + colIdx);
        if (col.type === 'label') {
          rowHtml += `
            <td class="excel-cell excel-cell-indicator">
              <input type="text" class="excel-input row-label-input font-medium text-xs md:text-sm" data-row-idx="${rowIdx}" data-cell="${colLetter}${rowIdx + 1}" value="${row.label}" spellcheck="false" title="Click to rename row">
            </td>`;
        } else {
          const val = row.values[col.id] !== undefined ? row.values[col.id] : 0;
          rowHtml += `
            <td class="excel-cell">
              <input type="number" class="excel-input cell-val-input font-mono font-bold text-xs md:text-sm" data-row-idx="${rowIdx}" data-col-id="${col.id}" data-cell="${colLetter}${rowIdx + 1}" value="${val}" min="0">
            </td>`;
        }
      });

      rowHtml += `
        <td class="excel-cell text-center">
          <button class="delete-row-btn text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Row" data-row-idx="${rowIdx}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>`;

      tr.innerHTML = rowHtml;
      this.tableBody.appendChild(tr);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  bindEvents() {
    // 1. Column Name Editing & Column Deletion
    if (this.tableHead) {
      this.tableHead.addEventListener('input', (e) => {
        if (e.target.classList.contains('col-name-input')) {
          const colId = e.target.getAttribute('data-col-id');
          const col = this.columns.find(c => c.id === colId);
          if (col) {
            col.name = e.target.value;
            this.drawChart();
          }
        }
      });

      this.tableHead.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-col-btn');
        if (btn) {
          const colId = btn.getAttribute('data-col-id');
          if (this.getNumericColumns().length > 1) {
            this.columns = this.columns.filter(c => c.id !== colId);
            this.rows.forEach(r => {
              delete r.values[colId];
              delete r.startValues[colId];
              delete r.currentValues[colId];
            });
            this.renderTable();
            this.triggerChartAnimation();
          }
        }
      });
    }

    // 2. Table Input Listeners (Row Label & Numeric Value Edits)
    if (this.tableBody) {
      this.tableBody.addEventListener('input', (e) => {
        const target = e.target;
        if (target.classList.contains('row-label-input')) {
          const rowIdx = parseInt(target.getAttribute('data-row-idx'));
          if (this.rows[rowIdx]) {
            this.rows[rowIdx].label = target.value;
            this.drawChart();
          }
        } else if (target.classList.contains('cell-val-input')) {
          const rowIdx = parseInt(target.getAttribute('data-row-idx'));
          const colId = target.getAttribute('data-col-id');
          const val = Math.max(0, parseFloat(target.value) || 0);

          if (this.rows[rowIdx]) {
            if (!this.rows[rowIdx].startValues) this.rows[rowIdx].startValues = {};
            if (!this.rows[rowIdx].currentValues) this.rows[rowIdx].currentValues = {};

            this.rows[rowIdx].startValues[colId] = this.rows[rowIdx].currentValues[colId] || 0;
            this.rows[rowIdx].values[colId] = val;
            this.triggerChartAnimation();
          }
        }
      });

      // Focus Tracker for Formula Bar
      this.tableBody.addEventListener('focusin', (e) => {
        const input = e.target;
        if (input.tagName === 'INPUT') {
          const cellCode = input.getAttribute('data-cell') || 'A1';
          if (this.nameBox) this.nameBox.textContent = cellCode;
          if (this.formulaInput) this.formulaInput.value = input.value;
        }
      });

      // Delete Row
      this.tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-row-btn');
        if (btn) {
          const rowIdx = parseInt(btn.getAttribute('data-row-idx'));
          if (this.rows.length > 1) {
            this.rows.splice(rowIdx, 1);
            this.renderTable();
            this.triggerChartAnimation();
          }
        }
      });
    }

    // 3. Search / Filter Rows
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterQuery = e.target.value || '';
        this.renderTable();
      });
    }

    // 4. Add Column Button
    const addColBtn = document.getElementById('excel-add-col-btn');
    if (addColBtn) {
      addColBtn.addEventListener('click', () => {
        const numCols = this.getNumericColumns().length;
        const newColId = `col_${Date.now().toString().slice(-4)}`;
        const color = this.colorPalette[numCols % this.colorPalette.length];

        this.columns.push({
          id: newColId,
          name: `Metric Series ${numCols + 1}`,
          type: 'numeric',
          color: color
        });

        this.rows.forEach(r => {
          const randomVal = Math.floor(Math.random() * 350) + 80;
          r.values[newColId] = randomVal;
          if (!r.startValues) r.startValues = {};
          if (!r.currentValues) r.currentValues = {};
          r.startValues[newColId] = 0;
          r.currentValues[newColId] = 0;
        });

        this.renderTable();
        this.triggerChartAnimation();
      });
    }

    // 5. Add Single Row Button
    const addRowBtn = document.getElementById('excel-add-row-btn');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', () => {
        this.addMultipleRows(1);
      });
    }

    // 6. Add 10 Rows (High-Load Generator)
    const add10RowsBtn = document.getElementById('excel-add-10-btn');
    if (add10RowsBtn) {
      add10RowsBtn.addEventListener('click', () => {
        this.addMultipleRows(10);
      });
    }

    // 7. Export to CSV Button
    const exportCsvBtn = document.getElementById('excel-export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        this.exportCSV();
      });
    }

    // 8. Clear Table Button
    const clearBtn = document.getElementById('excel-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.rows = [
          { label: 'New Metric 1', values: { col_1: 100 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } },
          { label: 'New Metric 2', values: { col_1: 200 }, startValues: { col_1: 0 }, currentValues: { col_1: 0 } }
        ];
        this.renderTable();
        this.triggerChartAnimation();
      });
    }

    // 9. Reset Button
    const resetBtn = document.getElementById('excel-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.loadPreset(this.datasets.domains);
      });
    }

    // 10. Dataset Selector Dropdown
    if (this.datasetSelect) {
      this.datasetSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (this.datasets[selected]) {
          this.loadPreset(this.datasets[selected]);
        }
      });
    }

    // 11. Chart Type Tabs
    const chartTypeBtns = document.querySelectorAll('.chart-type-tab');
    chartTypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        chartTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentChartType = btn.getAttribute('data-chart-type');

        this.rows.forEach(r => {
          this.getNumericColumns().forEach(col => {
            r.startValues[col.id] = 0;
          });
        });
        this.triggerChartAnimation();
      });
    });

    // 12. Canvas Mouse Interaction
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.isHover = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
      this.mouse.isHover = false;
    });
  }

  addMultipleRows(count) {
    const numCols = this.getNumericColumns();
    const currentLen = this.rows.length;

    for (let i = 0; i < count; i++) {
      const idx = currentLen + i + 1;
      const newRow = {
        label: `Dataset Row ${idx}`,
        values: {},
        startValues: {},
        currentValues: {}
      };

      numCols.forEach(col => {
        const randomVal = Math.floor(Math.random() * 450) + 50;
        newRow.values[col.id] = randomVal;
        newRow.startValues[col.id] = 0;
        newRow.currentValues[col.id] = 0;
      });

      this.rows.push(newRow);
    }

    this.renderTable();
    this.triggerChartAnimation();
  }

  exportCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Headers
    const headers = this.columns.map(c => `"${c.name}"`).join(',');
    csvContent += headers + '\r\n';

    // Rows
    this.rows.forEach(r => {
      const rowVals = this.columns.map(c => {
        if (c.type === 'label') return `"${r.label}"`;
        return r.values[c.id] || 0;
      });
      csvContent += rowVals.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_analytics_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadPreset(preset) {
    this.columns = JSON.parse(JSON.stringify(preset.columns));
    this.rows = preset.rows.map((r, i) => {
      const existing = this.rows[i];
      const startVals = {};
      const curVals = {};

      this.getNumericColumns().forEach(col => {
        startVals[col.id] = existing && existing.currentValues[col.id] ? existing.currentValues[col.id] : 0;
        curVals[col.id] = startVals[col.id];
      });

      return {
        label: r.label,
        values: JSON.parse(JSON.stringify(r.values)),
        startValues: startVals,
        currentValues: curVals
      };
    });

    this.renderTable();
    this.triggerChartAnimation();
  }

  bindDropzone() {
    const dropzone = this.dropzone;
    const fileInput = this.fileInput;
    if (!dropzone) return;

    dropzone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleExcelFile(e.target.files[0]);
        }
      });
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.handleExcelFile(files[0]);
      }
    });
  }

  handleExcelFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      try {
        if (window.XLSX) {
          const workbook = window.XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          this.processParsedSheetData(jsonRows, file.name);
        } else {
          const text = new TextDecoder().decode(data);
          this.processCSVText(text, file.name);
        }
      } catch (err) {
        console.error('Error parsing excel sheet:', err);
        alert('Could not parse Excel file. Please ensure it is a valid .xlsx or .csv spreadsheet.');
      }
    };

    reader.readAsArrayBuffer(file);
  }

  processParsedSheetData(sheetRows, fileName) {
    if (!sheetRows || sheetRows.length < 2) return;

    const firstRow = sheetRows[0];
    const secondRow = sheetRows[1];

    const hasHeader = isNaN(parseFloat(firstRow[1])) && !isNaN(parseFloat(secondRow[1]));
    const startRowIdx = hasHeader ? 1 : 0;
    const colCount = Math.min(sheetRows[startRowIdx].length, 8);

    const newColumns = [
      { id: 'cat', name: (hasHeader && firstRow[0]) ? String(firstRow[0]) : 'Category', type: 'label' }
    ];

    for (let c = 1; c < colCount; c++) {
      const colName = (hasHeader && firstRow[c]) ? String(firstRow[c]) : `Metric ${String.fromCharCode(65 + c)}`;
      newColumns.push({
        id: `col_${c}`,
        name: colName,
        type: 'numeric',
        color: this.colorPalette[(c - 1) % this.colorPalette.length]
      });
    }

    const newRows = [];
    // Support large volume: load up to 250 rows seamlessly
    for (let r = startRowIdx; r < Math.min(sheetRows.length, startRowIdx + 250); r++) {
      const rowData = sheetRows[r];
      if (rowData && rowData.length > 0) {
        const label = String(rowData[0] || `Row ${r + 1}`).trim();
        const vals = {};
        const startVals = {};
        const curVals = {};

        for (let c = 1; c < colCount; c++) {
          const val = Math.max(0, parseFloat(rowData[c]) || 0);
          vals[`col_${c}`] = val;
          startVals[`col_${c}`] = 0;
          curVals[`col_${c}`] = 0;
        }

        if (label) {
          newRows.push({
            label: label,
            values: vals,
            startValues: startVals,
            currentValues: curVals
          });
        }
      }
    }

    if (newRows.length > 0) {
      this.columns = newColumns;
      this.rows = newRows;
      this.renderTable();
      this.triggerChartAnimation();

      const dropLabel = document.getElementById('excel-drop-label');
      if (dropLabel) {
        dropLabel.innerHTML = `Loaded <span class="font-bold text-emerald-600">${fileName}</span> (${newRows.length} rows, ${newColumns.length - 1} metric columns)`;
      }
    }
  }

  processCSVText(csvText, fileName) {
    const lines = csvText.split('\n').filter(l => l.trim().length > 0);
    const rows = lines.map(l => l.split(','));
    this.processParsedSheetData(rows, fileName);
  }

  triggerChartAnimation() {
    this.animStartTime = performance.now();
    this.isAnimating = true;

    const numCols = this.getNumericColumns();
    let totalSum = 0;
    let maxVal = 0;
    let count = 0;

    this.rows.forEach(r => {
      numCols.forEach(col => {
        const val = r.values[col.id] || 0;
        totalSum += val;
        if (val > maxVal) maxVal = val;
        count++;
      });
    });

    const avgVal = count > 0 ? Math.round(totalSum / count) : 0;

    this.kpiStart = {
      total: this.kpiTarget.total || 0,
      avg: this.kpiTarget.avg || 0,
      max: this.kpiTarget.max || 0
    };

    this.kpiTarget = {
      total: totalSum,
      avg: avgVal,
      max: maxVal
    };

    if (this.kpiCount) this.kpiCount.textContent = this.rows.length;
  }

  startRenderLoop() {
    const loop = (now) => {
      if (this.isAnimating) {
        const elapsed = now - this.animStartTime;
        const progress = Math.min(1.0, elapsed / this.animDuration);

        // Smooth cubic easeInOut for slow, majestic morphing (2200ms)
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const numCols = this.getNumericColumns();

        // Interpolate every row value
        for (let i = 0; i < this.rows.length; i++) {
          const row = this.rows[i];
          numCols.forEach(col => {
            const start = (row.startValues && row.startValues[col.id] !== undefined) ? row.startValues[col.id] : 0;
            const target = (row.values && row.values[col.id] !== undefined) ? row.values[col.id] : 0;
            if (!row.currentValues) row.currentValues = {};
            row.currentValues[col.id] = start + (target - start) * ease;
          });
        }

        // Interpolate live KPI counter values
        if (this.kpiTotal) {
          const curTot = Math.round(this.kpiStart.total + (this.kpiTarget.total - this.kpiStart.total) * ease);
          this.kpiTotal.textContent = curTot.toLocaleString();
        }
        if (this.kpiAvg) {
          const curAvg = Math.round(this.kpiStart.avg + (this.kpiTarget.avg - this.kpiStart.avg) * ease);
          this.kpiAvg.textContent = curAvg.toLocaleString();
        }
        if (this.kpiMax) {
          const curMax = Math.round(this.kpiStart.max + (this.kpiTarget.max - this.kpiStart.max) * ease);
          this.kpiMax.textContent = curMax.toLocaleString();
        }

        if (progress >= 1.0) {
          this.isAnimating = false;
          for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            numCols.forEach(col => {
              row.currentValues[col.id] = row.values[col.id];
              row.startValues[col.id] = row.values[col.id];
            });
          }
        }
        this.drawChart();
      } else if (!this.isMobile) {
        this.drawChart();
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  drawChart() {
    const w = this.width;
    const h = this.height;
    this.ctx.clearRect(0, 0, w, h);

    if (this.rows.length === 0) return;

    switch (this.currentChartType) {
      case 'bar':
        this.drawBarChart(w, h);
        break;
      case 'pie':
        this.drawPieChart(w, h);
        break;
      case 'line':
        this.drawLineChart(w, h);
        break;
    }
  }

  // 1. HIGH-LOAD RESPONSIVE GROUPED BAR CHART
  drawBarChart(w, h) {
    const padding = { top: 50, bottom: 60, left: 60, right: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const numCols = this.getNumericColumns();
    if (numCols.length === 0) return;

    let maxVal = 10;
    this.rows.forEach(r => {
      numCols.forEach(col => {
        const v = Math.max(r.values[col.id] || 0, (r.currentValues && r.currentValues[col.id]) || 0);
        if (v > maxVal) maxVal = v;
      });
    });
    maxVal *= 1.15;

    // Dark Gridlines & Y-Axis
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1.0;
    this.ctx.font = '11px Outfit, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = Math.round(maxVal - (maxVal / 4) * i);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(w - padding.right, y);
      this.ctx.stroke();
      this.ctx.fillText(val.toLocaleString(), padding.left - 10, y + 4);
    }

    const rowCount = this.rows.length;
    const slotW = chartW / rowCount;
    const seriesCount = numCols.length;
    const individualBarW = Math.max(2, Math.min((slotW * 0.8) / seriesCount, 46));
    const groupW = individualBarW * seriesCount;
    const showLabels = rowCount <= 22;
    const labelStride = rowCount > 22 ? Math.ceil(rowCount / 15) : 1;

    for (let r = 0; r < rowCount; r++) {
      const row = this.rows[r];
      const groupStartX = padding.left + slotW * r + (slotW - groupW) * 0.5;

      for (let s = 0; s < seriesCount; s++) {
        const col = numCols[s];
        const curVal = (row.currentValues && row.currentValues[col.id] !== undefined) ? row.currentValues[col.id] : 0;
        const barH = Math.max(2, (curVal / maxVal) * chartH);
        const x = groupStartX + s * individualBarW;
        const y = padding.top + chartH - barH;

        const isHover = this.mouse.isHover && (
          this.mouse.x >= x && this.mouse.x <= x + individualBarW &&
          this.mouse.y >= y && this.mouse.y <= padding.top + chartH
        );

        // Bar Gradient on Dark
        const grad = this.ctx.createLinearGradient(0, y, 0, padding.top + chartH);
        grad.addColorStop(0, col.color);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.4)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, Math.max(2, individualBarW - 2), barH, [4, 4, 0, 0]);
        this.ctx.fill();

        // Top Accent Rim
        this.ctx.fillStyle = col.color;
        this.ctx.fillRect(x, y, Math.max(2, individualBarW - 2), 2.5);

        // Value Tag
        if ((rowCount <= 12 && seriesCount <= 2) || isHover) {
          this.ctx.fillStyle = isHover ? '#38bdf8' : '#f8fafc';
          this.ctx.font = isHover ? 'bold 12px Outfit, sans-serif' : '11px Outfit, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(Math.round(curVal), x + (individualBarW - 2) * 0.5, y - 8);
        }
      }

      // Bottom Row Name
      if (showLabels || r % labelStride === 0) {
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '500 11px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        const shortLabel = row.label.length > 10 ? row.label.substring(0, 8) + '..' : row.label;
        this.ctx.fillText(shortLabel, groupStartX + groupW * 0.5, padding.top + chartH + 20);
      }
    }

    this.drawChartLegend(w, numCols);
  }

  // 2. HIGH-LOAD SMART AGGREGATED DONUT / PIE CHART
  drawPieChart(w, h) {
    const cx = w * 0.38;
    const cy = h * 0.53;
    const radius = Math.min(w, h) * 0.40;
    const innerRadius = radius * 0.52;

    const numCols = this.getNumericColumns();
    if (numCols.length === 0) return;

    const primaryCol = numCols[0];
    const rawItems = this.rows.map((r, idx) => ({
      label: r.label,
      val: Math.max(0.1, (r.currentValues && r.currentValues[primaryCol.id]) || 0),
      color: this.colorPalette[idx % this.colorPalette.length]
    }));

    const total = rawItems.reduce((acc, v) => acc + v.val, 0) || 1;

    let displaySlices = [];
    if (rawItems.length > 8) {
      const sorted = [...rawItems].sort((a, b) => b.val - a.val);
      displaySlices = sorted.slice(0, 7);
      const remainingVal = sorted.slice(7).reduce((acc, v) => acc + v.val, 0);
      displaySlices.push({
        label: `Other (${rawItems.length - 7} items)`,
        val: remainingVal,
        color: '#64748b'
      });
    } else {
      displaySlices = rawItems;
    }

    let currentAngle = -Math.PI * 0.5;

    for (let i = 0; i < displaySlices.length; i++) {
      const slice = displaySlices[i];
      const sliceAngle = (slice.val / total) * Math.PI * 2;
      const endAngle = currentAngle + sliceAngle;

      this.ctx.fillStyle = slice.color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, currentAngle, endAngle);
      this.ctx.arc(cx, cy, innerRadius, endAngle, currentAngle, true);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = '#0b132b';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      currentAngle = endAngle;
    }

    // Center Donut Hole
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(Math.round(total).toLocaleString(), cx, cy - 8);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '11px Outfit, sans-serif';
    this.ctx.fillText(primaryCol.name.toUpperCase().substring(0, 14), cx, cy + 14);

    // Legend on Right
    const legendX = w * 0.68;
    const startY = Math.max(40, cy - (displaySlices.length * 26) * 0.5);

    this.ctx.textAlign = 'left';
    displaySlices.forEach((slice, idx) => {
      const ly = startY + idx * 26;
      const pct = Math.round((slice.val / total) * 100);

      this.ctx.fillStyle = slice.color;
      this.ctx.beginPath();
      this.ctx.arc(legendX, ly, 6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.font = '500 12px Outfit, sans-serif';
      const shortLabel = slice.label.length > 15 ? slice.label.substring(0, 13) + '..' : slice.label;
      this.ctx.fillText(shortLabel, legendX + 16, ly + 4);

      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 12px Outfit, sans-serif';
      this.ctx.fillText(`${pct}%`, legendX + 130, ly + 4);
    });
  }

  // 3. HIGH-LOAD HIGH-DENSITY SPLINE LINE GRAPH
  drawLineChart(w, h) {
    const padding = { top: 50, bottom: 60, left: 60, right: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const numCols = this.getNumericColumns();
    if (numCols.length === 0) return;

    let maxVal = 10;
    this.rows.forEach(r => {
      numCols.forEach(col => {
        const v = Math.max(r.values[col.id] || 0, (r.currentValues && r.currentValues[col.id]) || 0);
        if (v > maxVal) maxVal = v;
      });
    });
    maxVal *= 1.15;

    // Gridlines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1.0;
    this.ctx.font = '11px Outfit, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = Math.round(maxVal - (maxVal / 4) * i);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(w - padding.right, y);
      this.ctx.stroke();
      this.ctx.fillText(val.toLocaleString(), padding.left - 10, y + 4);
    }

    const count = this.rows.length;
    const stepX = chartW / (count - 1 || 1);
    const showMarkers = count <= 30;
    const showLabels = count <= 22;
    const labelStride = count > 22 ? Math.ceil(count / 15) : 1;

    numCols.forEach((col, sIdx) => {
      const points = [];
      for (let i = 0; i < count; i++) {
        const row = this.rows[i];
        const val = (row.currentValues && row.currentValues[col.id] !== undefined) ? row.currentValues[col.id] : 0;
        const targetH = (val / maxVal) * chartH;
        const x = padding.left + stepX * i;
        const y = padding.top + chartH - targetH;
        points.push({ x, y, val });
      }

      if (points.length < 2) return;

      // Area fill for primary line
      if (sIdx === 0) {
        const areaGrad = this.ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        areaGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
        areaGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

        this.ctx.fillStyle = areaGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, padding.top + chartH);
        this.ctx.lineTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const cx = (p1.x + p2.x) * 0.5;
          this.ctx.bezierCurveTo(cx, p1.y, cx, p2.y, p2.x, p2.y);
        }

        this.ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        this.ctx.closePath();
        this.ctx.fill();
      }

      // Line Path
      this.ctx.strokeStyle = col.color;
      this.ctx.lineWidth = 3.5;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const cx = (p1.x + p2.x) * 0.5;
        this.ctx.bezierCurveTo(cx, p1.y, cx, p2.y, p2.x, p2.y);
      }
      this.ctx.stroke();

      // Data Point Markers
      if (showMarkers) {
        points.forEach((pt) => {
          this.ctx.fillStyle = '#0b132b';
          this.ctx.strokeStyle = col.color;
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          if (count <= 12 && numCols.length <= 2) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 11px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Math.round(pt.val), pt.x, pt.y - 10);
          }
        });
      }
    });

    // Bottom Row Labels
    for (let i = 0; i < count; i++) {
      if (showLabels || i % labelStride === 0) {
        const x = padding.left + stepX * i;
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '500 11px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        const shortLabel = this.rows[i].label.length > 10 ? this.rows[i].label.substring(0, 8) + '..' : this.rows[i].label;
        this.ctx.fillText(shortLabel, x, padding.top + chartH + 20);
      }
    }

    this.drawChartLegend(w, numCols);
  }

  drawChartLegend(w, numCols) {
    if (numCols.length <= 1) return;

    this.ctx.font = '600 12px Outfit, sans-serif';
    let legendStartX = 60;
    const legendY = 22;

    numCols.forEach(col => {
      this.ctx.fillStyle = col.color;
      this.ctx.beginPath();
      this.ctx.arc(legendStartX + 5, legendY, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.textAlign = 'left';
      const shortName = col.name.length > 16 ? col.name.substring(0, 14) + '..' : col.name;
      this.ctx.fillText(shortName, legendStartX + 15, legendY + 4);

      legendStartX += this.ctx.measureText(shortName).width + 36;
    });
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.dataDashboardEngine = new DataDashboardEngine();
});

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useTable, useBlockLayout } from "react-table";
import axios from "axios";
import './ExcelToTable.css';

export const ExcelToTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newColumn, setNewColumn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);
  const [fileName, setFileName] = useState("");
  const [excelName, setExcelName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (excelName) {
      fetchStoredData(excelName);
    }
  }, [excelName]);

  useEffect(() => {
    // Apply search filter
    const filtered = data.filter(row => {
      return Object.values(row).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredData(filtered);
    //setCurrentPage(1); // Comment out this line to prevent resetting to the first page on search
  }, [searchTerm, data]);

  const fetchStoredData = (name) => {
    axios.get(`http://localhost:5000/getData/${name}`)
      .then(response => {
        const storedData = response.data;
        if (storedData.length > 0) {
          const headers = Object.keys(storedData[0]);
          const cols = headers.map(header => ({
            Header: header,
            accessor: header,
          }));
          setColumns(cols);
          setData(storedData);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      const cols = headers.map((header) => ({
        Header: header,
        accessor: header,
      }));

      const formattedData = rows.map((row) =>
        row.reduce((acc, val, idx) => {
          acc[headers[idx]] = val;
          return acc;
        }, {})
      );

      setColumns(cols);
      setData(formattedData);
      setFileName(file.name);
      setCurrentPage(1); // Reset to first page
    };

    reader.readAsBinaryString(file);
  };

  const addColumn = () => {
    if (!newColumn) return; // Prevent adding empty column names

    const newCol = {
      Header: newColumn,
      accessor: newColumn,
    };

    const updatedColumns = [...columns, newCol];
    const updatedData = data.map(row => ({ ...row, [newColumn]: "" }));

    setColumns(updatedColumns);
    setData(updatedData);
    setNewColumn("");
    setCurrentPage(1); // Reset to first page
  };

  const addRow = () => {
    const emptyRow = columns.reduce((acc, col) => {
      acc[col.accessor] = "";
      return acc;
    }, {});
    setData([...data, emptyRow]);
    setFilteredData([...filteredData, emptyRow]);
    setCurrentPage(Math.ceil((data.length + 1) / rowsPerPage)); // Navigate to last page
  };

  const handleInputChange = (e, rowIndex, columnId) => {
    const newValue = e.target.value;
    const updatedData = [...data];
    const actualIndex = indexOfFirstRow + rowIndex; // Correctly map to the actual data index
    updatedData[actualIndex][columnId] = newValue;
    setData(updatedData);

    // Update filtered data based on the updated data
    const filtered = updatedData.filter(row => {
      return Object.values(row).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredData(filtered);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "UpdatedData.xlsx");
  };

  const saveToDatabase = () => {
    axios.post('http://localhost:5000/saveData', { name: excelName, data })
      .then(response => {
        alert('Data saved successfully');
        fetchStoredData(excelName); // Fetch updated data after save
      })
      .catch(error => {
        console.error('Error saving data:', error.response ? error.response.data : error.message);
        alert('Error saving data: ' + (error.response ? error.response.data : error.message));
      });
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data: currentRows }, useBlockLayout);

  return (
    <div className="excel-to-table">
      <input type="text" placeholder="Excel Name" value={excelName} onChange={(e) => setExcelName(e.target.value)} />
      <button onClick={() => fetchStoredData(excelName)}>Load Data</button>
      <input type="file" onChange={handleFileUpload} />
      <div className="input-fields">
        <input
          type="text"
          placeholder="Column Title"
          value={newColumn}
          onChange={(e) => setNewColumn(e.target.value)}
        />
        <button onClick={addColumn}>Add Column</button>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {filteredData.length > 0 && (
        <>
          <table {...getTableProps()} className="styled-table">
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th {...column.getHeaderProps()}>{column.render("Header")}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <td {...cell.getCellProps()}>
                        <input
                          type="text"
                          value={cell.value || ""}
                          onChange={(e) => handleInputChange(e, row.index, cell.column.id)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={downloadExcel}>Download Excel</button>
          <button onClick={saveToDatabase}>Save to Database</button>
          <button onClick={addRow}>Add Row</button>
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

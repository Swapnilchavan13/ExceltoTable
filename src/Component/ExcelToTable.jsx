import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useTable, useBlockLayout } from "react-table";
import './ExcelToTable.css';

export const ExcelToTable = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newColumn, setNewColumn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(15);

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

  const handleInputChange = (e, rowIndex, columnId) => {
    const newValue = e.target.value;
    const updatedData = data.map((row, idx) =>
      idx === rowIndex ? { ...row, [columnId]: newValue } : row
    );
    setData(updatedData);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "UpdatedData.xlsx");
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data: currentRows }, useBlockLayout);

  return (
    <div className="excel-to-table">
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
      {data.length > 0 && (
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
                          value={row.original[cell.column.id] || ""}
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

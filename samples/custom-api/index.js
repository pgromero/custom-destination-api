// Mimimal conforming custom connection implementation - zero external
// dependencies

const server = {};

server.test_connection = () => {
  return { success: true };
};

server.list_objects = () => {
  return {
    objects: [
      { object_api_name: "customer", label: "Customers" },
      { object_api_name: "event", label: "Events", can_create_fields: 'on_write' },
    ],
  };
};

server.supported_operations = ({ object }) => {
  console.log("listing operations for object", object);
  return { operations: ["upsert"] };
};

server.list_fields = ({ object }) => {
  console.log("listing fields for object", object);
  return {
    fields: [
      {
        field_api_name: "custom_id_in_destination",
        label: "ID",
        identifier: true,
        createable: true,
        updateable: true,
        type: "string",
        required: true,
        array: false,
      },
      {
        field_api_name: "email",
        label: "Email",
        identifier: false,
        createable: true,
        updateable: true,
        type: "string",
        required: true,
        array: false,
      },
      {
        field_api_name: "name",
        label: "Name",
        identifier: false,
        createable: true,
        updateable: true,
        type: "string",
        required: true,
        array: false,
      },
    ],
  };
};

server.get_sync_speed = () => {
  console.log("get sync speed");
  return {
    maximum_batch_size: 200,
    maximum_records_per_second: 100,
    maximum_parallel_batches: 4,
  };
};

server.sync_batch = ({ operation, records }) => {
  console.log("sync one batch of data", { operation, records });
  let message = "";
  let status = "success"
  switch (operation) {
    case "upsert":
      message = "Records upserted";
      break;
    case "insert":
      message = 'Records inserted';
      break;
    case "delete":
      message = "Records deleted";
      break;
    default:
      message = "Invalid operation";
      status = "fail";
  }

  return {
    executed_operation: operation,
    status: status,
    message: message,
    record_results: status === "fail" ? [] : records.map((record, index) => {
      success = [true, false][index % 2];
      return {
        identifier: record.custom_id_in_destination,
        success,
        error_message: success ? null : "oops!",
      };
    }),
  };
};

// Run as a AWS Lambda-style handler function

exports.handler = async function(event, context) {
  const requestBodyBuffer = event.body;
  const { id, method, params } = JSON.parse(requestBodyBuffer);

  const result = server[method](params);

  const response = {
    id,
    result,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response)
  };
}

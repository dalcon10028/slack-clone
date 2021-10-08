export default {
  name: "message-list",
  props: {
    messages: {
      type: Array,
      default: [],
      required: true,
    },
  },
};

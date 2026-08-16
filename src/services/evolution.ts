import axios from 'axios';

const client = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: { 'apikey': process.env.EVOLUTION_API_KEY! },
});

export const evolutionService = {
  async fetchGroups() {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const response = await client.get(`/group/fetchAllGroups/${instance}?getParticipants=false`);
    return response.data;
  },

  async sendMedia(number: string, mediaUrl: string, caption: string) {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const response = await client.post(`/message/sendMedia/${instance}`, {
      number,
      mediatype: 'image',
      mimetype: 'image/jpeg',
      caption,
      media: mediaUrl,
      fileName: 'produto.jpg',
    });
    return response.data;
  },
  async sendText(number: string, text: string) {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const response = await client.post(`/message/sendText/${instance}`, { number, text });
    return response.data;
  },

  async connectionState() {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const response = await client.get(`/instance/connectionState/${instance}`);
    return response.data;
  },
};

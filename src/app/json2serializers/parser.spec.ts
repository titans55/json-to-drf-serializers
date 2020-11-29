import { JsonToSerializerParser } from "./parser"
import { assert } from 'console'

describe('JsonToSerializerParser', () => {
    let parser: JsonToSerializerParser

    beforeAll(() => {
        parser = new JsonToSerializerParser()
    })

    it('should be able to parse a simple json to drf serializer', () => {
        expect(parser.parse({
            name: 'Kutay',
            isLazy: true,
            age: 80,
        })).toBe(
            "from rest_framework import serializers\n\n" +
            "class ExampleSerializer(serializers.Serializer):\n" +
            "   name = serializers.CharField()\n" +
            "   is_lazy = serializers.BooleanField()\n" +
            "   age = serializers.IntegerField()\n"
        )
    })

    it('should be able to parse a json with array to drf serializer', () => {
        expect(parser.parse({
            scopeIds: [1, 2, 5, 9]
        })).toBe(
            "from rest_framework import serializers\n\n" +
            "class ExampleSerializer(serializers.Serializer):\n" +
            "   scope_ids = serializers.IntegerField(many=True)\n"
        )
    })

    it('should be able to parse a nested json to drf serializer', () => {
        expect(parser.parse({
            name: "Kutay",
            age: 80,
            contactInfo: {
                github: "https://github.com/titans55",
                address: "World"
            }
        })).toBe(
            "from rest_framework import serializers\n\n" +
            "class ContactInfoSerializer(serializers.Serializer):\n" +
            "   github = serializers.CharField()\n" +
            "   address = serializers.CharField()\n\n" +
            "class ExampleSerializer(serializers.Serializer):\n" +
            "   name = serializers.CharField()\n" +
            "   age = serializers.IntegerField()\n" +
            "   contact_info = ContactInfoSerializer()\n"
        )
    })


    it('should be able to parse a complex json to drf serializer', () => {
        expect(parser.parse({
            name: "Ashlee Buckner",
            age: 27,
            eyeColor: "green",
            friends: [
                {
                    id: 0,
                    name: "Gaines Mccall"
                },
                {
                    id: 1,
                    name: "Gabrielle Reid"
                },
                {
                    id: 2,
                    name: "Mcguire Macias"
                }
            ],
            parent: {
                name: "Kathleen Poole",
                isActive: true,
                age: 36,
                eyeColor: "blue",
                parent: {
                    name: "Tillman Ryan",
                    parent: {
                        age: 32
                    }
                }
            },
        })).toBe(
            "from rest_framework import serializers\n\n" +
            "class Parent2Serializer(serializers.Serializer):\n" +
            "   age = serializers.IntegerField()\n\n" +
            "class Parent1Serializer(serializers.Serializer):\n" +
            "   name = serializers.CharField()\n" +
            "   parent = Parent2Serializer()\n\n" +
            "class ParentSerializer(serializers.Serializer):\n" +
            "   name = serializers.CharField()\n" +
            "   is_active = serializers.BooleanField()\n" +
            "   age = serializers.IntegerField()\n" +
            "   eye_color = serializers.CharField()\n" +
            "   parent = Parent1Serializer()\n\n" +
            "class FriendsSerializer(serializers.Serializer):\n" +
            "   id = serializers.IntegerField()\n" +
            "   name = serializers.CharField()\n\n" +
            "class ExampleSerializer(serializers.Serializer):\n" +
            "   name = serializers.CharField()\n" +
            "   age = serializers.IntegerField()\n" +
            "   eye_color = serializers.CharField()\n" +
            "   friends = FriendsSerializer(many=True)\n"+
            "   parent = ParentSerializer()\n"
        )
    })
})